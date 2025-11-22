import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
}).strict();

export const RequestSchema = z.object({ messages: z.array(MessageSchema) });
export const TodoItemSchema = z.object({ title: z.string(), done: z.boolean().optional() }).strict();
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  todos: z.array(TodoItemSchema).optional(),
  activeTab: z.enum(['map','floor','todos','image3d']).optional(),
  plannerHasSvg: z.boolean().optional(),
});
