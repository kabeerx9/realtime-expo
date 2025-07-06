import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import * as Api from "../factories/apiErrorFactory";
import * as ApiResponse from "../factories/apiResponseFactory";
import { AuthenticatedUser } from "../types/auth";
import {
  CreateTodoInput,
  UpdateTodoInput,
  TodoParams,
  GetTodosQuery,
} from "../validations/todo.validation";

export class TodoController {
  static async createTodo(
    req: Request<{}, {}, CreateTodoInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      const { title, description, priority, dueDate } = req.body;

      const todo = await prisma.todo.create({
        data: {
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(
        ApiResponse.created(todo, "Todo created successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTodos(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      // Query parameters are validated by middleware
      const { completed, priority, page = 1, limit = 10 } = req.query as any;

      const where: any = {
        userId: user.id,
      };

      if (completed !== undefined) {
        where.completed = completed === "true";
      }

      if (priority) {
        where.priority = priority;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [todos, totalCount] = await Promise.all([
        prisma.todo.findMany({
          where,
          orderBy: [
            { completed: "asc" },
            { priority: "desc" },
            { createdAt: "desc" },
          ],
                  skip,
        take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        prisma.todo.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      res.json(
        ApiResponse.ok(
          {
            todos,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              totalCount,
              totalPages,
              hasNext: Number(page) < totalPages,
              hasPrev: Number(page) > 1,
            },
          },
          "Todos retrieved successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTodo(
    req: Request<TodoParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      const todo = await prisma.todo.findFirst({
        where: {
          id,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!todo) {
        return next(Api.notFound("Todo not found"));
      }

      res.json(ApiResponse.ok(todo, "Todo retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async updateTodo(
    req: Request<TodoParams, {}, UpdateTodoInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;
      const updateData = req.body;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingTodo) {
        return next(Api.notFound("Todo not found"));
      }

      // Prepare update data
      const dataToUpdate: any = { ...updateData };
      if (updateData.dueDate !== undefined) {
        dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
      }

      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json(ApiResponse.ok(updatedTodo, "Todo updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTodo(
    req: Request<TodoParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingTodo) {
        return next(Api.notFound("Todo not found"));
      }

      await prisma.todo.delete({
        where: { id },
      });

      res.json(ApiResponse.ok(null, "Todo deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async toggleTodo(
    req: Request<TodoParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user as AuthenticatedUser;
      const { id } = req.params;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!existingTodo) {
        return next(Api.notFound("Todo not found"));
      }

      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: {
          completed: !existingTodo.completed,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json(ApiResponse.ok(updatedTodo, "Todo toggled successfully"));
    } catch (error) {
      next(error);
    }
  }
}
