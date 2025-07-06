import { Router } from "express";
import { TodoController } from "../controllers/todo.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
  getTodoSchema,
  getTodosSchema,
} from "../validations/todo.validation";

const router = Router();

// All todo routes require authentication
router.use(authMiddleware);

// GET /api/todos - Get all todos for authenticated user
router.get("/", validate(getTodosSchema), TodoController.getTodos);

// GET /api/todos/:id - Get specific todo
router.get("/:id", validate(getTodoSchema), TodoController.getTodo);

// POST /api/todos - Create new todo
router.post("/", validate(createTodoSchema), TodoController.createTodo);

// PUT /api/todos/:id - Update todo
router.put("/:id", validate(updateTodoSchema), TodoController.updateTodo);

// DELETE /api/todos/:id - Delete todo
router.delete("/:id", validate(deleteTodoSchema), TodoController.deleteTodo);

// PATCH /api/todos/:id/toggle - Toggle todo completion
router.patch("/:id/toggle", validate(getTodoSchema), TodoController.toggleTodo);

export default router;
