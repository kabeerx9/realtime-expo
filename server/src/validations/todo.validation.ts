import { z } from "zod";

const priorityEnum = z.enum(["low", "medium", "high"]);

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    description: z.string().optional(),
    priority: priorityEnum.default("medium"),
    dueDate: z.string().datetime().optional(),
  }),
});

export const updateTodoSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid todo ID"),
  }),
  body: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

export const deleteTodoSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid todo ID"),
  }),
});

export const getTodoSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid todo ID"),
  }),
});

export const getTodosSchema = z.object({
  query: z.object({
    completed: z.enum(["true", "false"]).optional(),
    priority: priorityEnum.optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  }),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>['body'];
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>['body'];
export type TodoParams = z.infer<typeof getTodoSchema>['params'];
export type GetTodosQuery = z.infer<typeof getTodosSchema>['query'];
