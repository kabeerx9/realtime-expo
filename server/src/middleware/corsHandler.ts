import cors from "cors";
import { environment } from "../config/environment";

// Allow all origins for Expo app and web development
const corsOptions: cors.CorsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
