import { Router } from "express";
import authRoutes from "./auth.routes";
import todoRoutes from "./todo.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/todos", todoRoutes);

// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);

export default router;
