interface Player {
  id: string;
  name: string;
  position: string;
  baseSkill: number;
}

interface GameEvent {
  id: string;
  playerId: string;
  playerName: string;
  action: string;
  pointsChange: number;
  timestamp: Date;
}

interface Room {
  id: string;
  players: string[]; // socket IDs
  playerAssignments: { [socketId: string]: Player[] };
  scores: { [socketId: string]: number };
  gameStarted: boolean;
  gameEnded: boolean;
  events: GameEvent[];
  gameTimer: NodeJS.Timeout | null;
  eventTimer: NodeJS.Timeout | null;
  createdAt: Date;
  winnerId?: string;
}

// Hardcoded 10 fantasy players
const FANTASY_PLAYERS: Player[] = [
  { id: "p1", name: "Aragorn", position: "Warrior", baseSkill: 85 },
  { id: "p2", name: "Legolas", position: "Archer", baseSkill: 90 },
  { id: "p3", name: "Gimli", position: "Tank", baseSkill: 80 },
  { id: "p4", name: "Gandalf", position: "Mage", baseSkill: 95 },
  { id: "p5", name: "Boromir", position: "Knight", baseSkill: 75 },
  { id: "p6", name: "Frodo", position: "Scout", baseSkill: 70 },
  { id: "p7", name: "Sam", position: "Support", baseSkill: 72 },
  { id: "p8", name: "Merry", position: "Rogue", baseSkill: 68 },
  { id: "p9", name: "Pippin", position: "Bard", baseSkill: 65 },
  { id: "p10", name: "Faramir", position: "Ranger", baseSkill: 82 }
];

const GAME_EVENTS = [
  { action: "landed a critical hit", points: [15, 20, 25] },
  { action: "cast a powerful spell", points: [18, 22, 28] },
  { action: "made a tactical error", points: [-15, -10, -8] },
  { action: "defended successfully", points: [10, 12, 15] },
  { action: "got ambushed", points: [-20, -15, -12] },
  { action: "found rare treasure", points: [25, 30, 35] },
  { action: "failed to dodge", points: [-8, -6, -4] },
  { action: "executed perfect combo", points: [20, 25, 30] },
  { action: "lost concentration", points: [-12, -8, -5] },
  { action: "inspired the team", points: [16, 18, 22] }
];

class GameService {
  private static instance: GameService;
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  findOrCreateRoom(socketId: string): { action: 'created' | 'joined'; roomId: string; players: Player[]; } {
    const availableRoomId = this.findAvailableRoom();
    if (availableRoomId) {
      // Join existing room
      const result = this.joinRoom(socketId, availableRoomId);
      // This fallback is just for safety, in theory joinRoom should always succeed here.
      if (!result.success || !result.roomId || !result.players) {
        const { roomId, players } = this.createRoom(socketId);
        return { action: 'created', roomId, players };
      }
      return { action: 'joined', roomId: result.roomId, players: result.players };
    } else {
      // Create new room
      const { roomId, players } = this.createRoom(socketId);
      return { action: 'created', roomId, players };
    }
  }

  private createRoom(socketId: string): { roomId: string; players: Player[] } {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Assign first 5 players to room creator
    const assignedPlayers = FANTASY_PLAYERS.slice(0, 5);

    const room: Room = {
      id: roomId,
      players: [socketId],
      playerAssignments: { [socketId]: assignedPlayers },
      scores: { [socketId]: 0 },
      gameStarted: false,
      gameEnded: false,
      events: [],
      gameTimer: null,
      eventTimer: null,
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socketId, roomId);

    console.log(`Room ${roomId} created by ${socketId}`);
    return { roomId, players: assignedPlayers };
  }

  private joinRoom(socketId: string, roomId?: string): { success: boolean; roomId?: string; players?: Player[]; error?: string } {
    // If no roomId provided, find available room
    if (!roomId) {
      roomId = this.findAvailableRoom();
      if (!roomId) {
        return { success: false, error: "No available rooms" };
      }
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    if (room.players.length >= 2) {
      return { success: false, error: "Room is full" };
    }

    if (room.gameStarted) {
      return { success: false, error: "Game already started" };
    }

    // Assign last 5 players to the second player
    const assignedPlayers = FANTASY_PLAYERS.slice(5, 10);

    room.players.push(socketId);
    room.playerAssignments[socketId] = assignedPlayers;
    room.scores[socketId] = 0;

    this.socketToRoom.set(socketId, roomId);

    console.log(`Player ${socketId} joined room ${roomId}`);

    return { success: true, roomId, players: assignedPlayers };
  }

  private findAvailableRoom(): string | undefined {
    for (const [roomId, room] of this.rooms) {
      if (room.players.length === 1 && !room.gameStarted) {
        return roomId;
      }
    }
    return undefined;
  }

  startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.gameStarted) return;

    room.gameStarted = true;
    console.log(`Game started in room ${roomId}`);

    // Start event generation every 4 seconds for 1 minute (15 events)
    let eventCount = 0;
    const maxEvents = 15;

    room.eventTimer = setInterval(() => {
      if (eventCount >= maxEvents) {
        this.endGame(roomId);
        return;
      }

      this.generateRandomEvent(roomId);
      eventCount++;
    }, 4000);

    // Safety timer to end game after 1 minute
    room.gameTimer = setTimeout(() => {
      this.endGame(roomId);
    }, 60000);
  }

    private generateRandomEvent(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.gameEnded) return;

    // Pick random player from all 10 players
    const randomPlayer = FANTASY_PLAYERS[Math.floor(Math.random() * FANTASY_PLAYERS.length)];

    // Pick random event
    const eventTemplate = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
    const pointsChange = eventTemplate.points[Math.floor(Math.random() * eventTemplate.points.length)];

    const gameEvent: GameEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      playerId: randomPlayer.id,
      playerName: randomPlayer.name,
      action: eventTemplate.action,
      pointsChange,
      timestamp: new Date()
    };

    // Find which player owns this fantasy player and update their score
    for (const [socketId, players] of Object.entries(room.playerAssignments)) {
      if (players.some(p => p.id === randomPlayer.id)) {
        room.scores[socketId] += pointsChange;
        break;
      }
    }

    room.events.push(gameEvent);
    console.log(`Event in room ${roomId}: ${randomPlayer.name} ${eventTemplate.action} (${pointsChange > 0 ? '+' : ''}${pointsChange})`);

    // Emit event immediately to all players in the room
    this.emitEventToRoom(roomId, gameEvent);
  }

  private emitEventToRoom(roomId: string, gameEvent: GameEvent): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Import io here to avoid circular dependency
    const { io } = require('./app');

    room.players.forEach(socketId => {
      const opponentId = room.players.find(id => id !== socketId);
      io.to(socketId).emit("game_event", {
        event: gameEvent,
        currentScore: room.scores[socketId] || 0,
        opponentScore: opponentId ? (room.scores[opponentId] || 0) : 0,
        allScores: room.scores,
        gameEnded: room.gameEnded,
        isMyPlayer: room.playerAssignments[socketId].some(p => p.id === gameEvent.playerId)
      });
    });
  }

  private endGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.gameEnded) return;

    room.gameEnded = true;

    // --- Calculate and store the winner on the room object ---
    const playerIds = Object.keys(room.scores);
    if (playerIds.length === 1) {
      room.winnerId = playerIds[0];
    } else if (playerIds.length === 2) {
      const playerA = playerIds[0];
      const playerB = playerIds[1];
      if (room.scores[playerA] > room.scores[playerB]) {
        room.winnerId = playerA;
      } else if (room.scores[playerB] > room.scores[playerA]) {
        room.winnerId = playerB;
      }
      // If scores are equal, room.winnerId remains undefined.
    }
    // ---

    // Clear timers
    if (room.eventTimer) {
      clearInterval(room.eventTimer);
      room.eventTimer = null;
    }
    if (room.gameTimer) {
      clearTimeout(room.gameTimer);
      room.gameTimer = null;
    }

    console.log(`Game ended in room ${roomId}`);
    console.log('Final scores:', room.scores);

    // Broadcast game end to all players
    this.broadcastGameEnd(roomId);
  }

  private broadcastGameEnd(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // The winner is now part of the canonical room state.
    const { winnerId, scores } = room;

    console.log(`[Game End] Broadcasting end for room ${roomId}. Winner: ${winnerId || 'Tie'}. Scores:`, scores);

    // Import io here to avoid circular dependency
    const { io } = require('./app');

    room.players.forEach((socketId) => {
      io.to(socketId).emit('game_ended', {
        message: 'Game Over!',
        finalScores: scores,
        winnerId: winnerId,
      });
    });
  }

  leaveRoom(socketId: string): void {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter(id => id !== socketId);
    delete room.playerAssignments[socketId];
    delete room.scores[socketId];

    this.socketToRoom.delete(socketId);

    console.log(`Player ${socketId} left room ${roomId}`);

    // If room is empty or game was in progress, clean up
    if (room.players.length === 0) {
      this.cleanupRoom(roomId);
    }
  }

  private cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear any residual timers before deleting
    if (room.eventTimer) {
      clearInterval(room.eventTimer);
    }
    if (room.gameTimer) {
      clearTimeout(room.gameTimer);
    }

    // Remove all players from the lookup map
    room.players.forEach(socketId => {
      this.socketToRoom.delete(socketId);
    });

    this.rooms.delete(roomId);
    console.log(`Room ${roomId} cleaned up.`);
  }

  getRoomData(socketId: string): Room | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }
}

export default GameService.getInstance();
