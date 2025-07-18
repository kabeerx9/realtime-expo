import http from "http";
import express, { Request, Response } from "express";
import helmet from "helmet";
import "./config/logging";
import morgan from "morgan";
import { logger } from "./config/logger";
import cookieParser from "cookie-parser";
import { prisma } from "./utils/prisma";
import { environment } from "./config/environment";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/notFound.middleware";
import { rateLimiterMiddleware } from "./middleware/rateLimiter.middleware";
import passport from "./config/passport";
import expressWinston from "express-winston";
import { devFormat, productionFormat } from "./middleware/loggingHandler";
import { corsMiddleware } from "./middleware/corsHandler";
import emailService from "./services/email.service";
import healthCheckService from "./services/healthcheck.service";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { AuthenticatedUser } from "./types/auth";
import { RequestWithUser } from "./types/request";
import routes from "./routes";
import { Server } from "socket.io";
import gameService from "./gameService";
import { randomUUID } from "crypto";

export const app = express();
export let httpServer: ReturnType<typeof http.createServer>;
export let io: Server;

// In-memory storage for chat messages
const chatMessages: Array<{
  id: string;
  text: string;
  user: string;
  timestamp: Date;
}> = [];

// Passport initialization
// app.use(passport.initialize());

export const Main = async () => {
  logging.info("Initializing API");

  // Logging middleware
  app.use(requestIdMiddleware);

  app.use(
    expressWinston.logger({
      winstonInstance: logger,
      msg: "HTTP {{req.method}} {{req.url}}",
      meta: true,
      metaField: null,
      expressFormat: false,
      colorize: false,
      dynamicMeta: (req) => {
        const user = req.user as AuthenticatedUser | undefined;

        return {
          requestId: (req as RequestWithUser).requestId,
          userId: user?.id,
          userRole: user?.role,
        };
      },
    })
  );

  if (environment.nodeEnv === "production") {
    app.use(morgan(productionFormat));
  } else {
    app.use(morgan(devFormat));
  }

    // Security and parsing middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(helmet());
  app.use(cookieParser());
  app.use(corsMiddleware);
  app.use(rateLimiterMiddleware);

  // API Routes
  app.use('/api', routes);

  logging.info("Setting up email service");
  // Email service - COMMENT OUT FOR SIMPLE VERSION
  // await emailService.verifyTransport();

  logging.info("Connecting to PostgreSQL with Prisma");

  try {
    await prisma.$connect();
    logging.info("Connected to PostgreSQL successfully");
  } catch (error) {
    logging.info("Unable to connect to PostgreSQL");
    logging.error(error);
    // process.exit(1);
  }

  logging.info("Health Check Route");

  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ status: "OK" });
  });

  app.get("/healthcheck", async (req: Request, res: Response) => {
    try {
      const healthStatus = await healthCheckService.performHealthCheck();
      res.status(200).json(healthStatus);
    } catch (error) {
      logging.error("Health check failed:", error);
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
      });
    }
  });

  // Not found route
  app.use(notFoundMiddleware);

  // Error Handling
  app.use(
    errorMiddleware as (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => void
  );

  logging.info("Start Server");

  httpServer = http.createServer(app);

  // Socket.io setup
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io chat handlers
  io.on("connection", (socket) => {
    logging.info(`New client connected: ${socket.id}`);

    socket.on("find_or_create_room", () => {
      const result = gameService.findOrCreateRoom(socket.id);
      socket.join(result.roomId);

      if (result.action === 'created') {
        socket.emit("room_created", { roomId: result.roomId, players: result.players });
        logging.info(`Player ${socket.id} created and joined room ${result.roomId}`);
      } else if (result.action === 'joined') {
        socket.emit("room_joined", { roomId: result.roomId, players: result.players });
        logging.info(`Player ${socket.id} joined room ${result.roomId}`);

        // The game is starting, notify both players with full context
        const roomData = gameService.getRoomData(socket.id);
        if (roomData && roomData.players.length === 2) {
            logging.info(`[Game] Starting game in room ${roomData.id}`);
            // Explicitly start the game in the service
            gameService.startGame(roomData.id);

            // Notify clients that the game is starting
            roomData.players.forEach(playerId => {
                io.to(playerId).emit("game_starting", {
                    roomId: roomData.id,
                    scores: roomData.scores,
                    playerAssignments: roomData.playerAssignments
                });
            });
        }
      }
    });

    // Get current room status
    socket.on("get_room_status", () => {
      const roomData = gameService.getRoomData(socket.id);
      if (roomData) {
        socket.emit("room_status", roomData);
      } else {
        socket.emit("room_error", { success: false, error: "Not in a room" });
      }
    });

    socket.on("leave_room", () => {
      logging.info(`Client ${socket.id} is leaving their room.`);
      gameService.leaveRoom(socket.id);
    });

    socket.on("disconnect", () => {
      logging.info(`Client disconnected: ${socket.id}`);
      gameService.leaveRoom(socket.id);
    });

    // Chat message
    socket.on("message", (data: { text: string; user: string }) => {
      // The server is now the source of truth for the message object
      const newMessage = {
        id: randomUUID(), // Generate a unique ID on the server
        text: data.text,
        user: data.user,
        timestamp: new Date(), // Use the server's timestamp
      };

      logging.info(`Message from ${newMessage.user}: ${newMessage.text}`);

      // Store the complete message object
      chatMessages.push(newMessage);

      // Broadcast the complete message object to all connected clients
      logging.info(`[Socket] Broadcasting 'message' to all clients`);
      io.emit("message", newMessage);
    });

    // Handle typing indicators
    socket.on("user_typing", (data: { user: string }) => {
      logging.info(`${data.user} is typing`);
      // Broadcast to all other clients (not the sender)
      socket.broadcast.emit("user_typing", data);
    });

    socket.on("user_stopped_typing", (data: { user: string }) => {
      logging.info(`${data.user} stopped typing`);
      // Broadcast to all other clients (not the sender)
      socket.broadcast.emit("user_stopped_typing", data);
    });

    // ===== FANTASY GAME HANDLERS =====

    // Handle a player's click during a round - NOT NEEDED FOR THIS GAME
    // socket.on("player_clicked", () => {
    //   gameService.handlePlayerClick(socket.id, io);
    // });

    // Get current room status
    // socket.on("get_room_status", () => {
    //   const roomData = gameService.getRoomData(socket.id);
    //   if (roomData) {
    //     socket.emit("room_status", {
    //       roomId: roomData.id,
    //       playerCount: roomData.players.length,
    //       gameStarted: roomData.gameStarted,
    //       gameEnded: roomData.gameEnded,
    //       currentScore: roomData.scores[socket.id] || 0,
    //       events: roomData.events
    //     });
    //   } else {
    //     socket.emit("room_status", { error: "Not in any room" });
    //   }
    // });

    // socket.on("disconnect", () => {
    //   logging.info(`User disconnected: ${socket.id}`);

    //   // Handle game room cleanup
    //   gameService.leaveRoom(socket.id);
    // });
    });

  httpServer.listen(environment.port, () => {
    logging.info(
      "Server Started:" + environment.serverHostname + ":" + environment.port
    );
  });

  // Handle uncaught exceptions and rejections
  process.on("uncaughtException", (error: Error) => {
    logging.error("Uncaught Exception:", error);
    Shutdown(() => process.exit(1));
  });

  process.on("unhandledRejection", (reason: any) => {
    logging.error("Unhandled Rejection:", reason);
    Shutdown(() => process.exit(1));
  });
};

export const Shutdown = async (callback: () => void) => {
  logging.info("Server shutting down...");
  try {
    await prisma.$disconnect();
    logging.info("Database disconnected successfully");
    if (httpServer) {
      httpServer.close(() => {
        logging.info("Server closed successfully");
        if (callback) callback();
      });
    }
  } catch (error) {
    logging.error("Error during shutdown:", error);
    if (callback) callback();
  }
};

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logging.info("SIGTERM received");
  Shutdown(() => process.exit(0));
});

process.on("SIGINT", () => {
  logging.info("SIGINT received");
  Shutdown(() => process.exit(0));
});

Main().catch((error) => {
  logging.error("Failed to start server:", error);
  process.exit(1);
});
