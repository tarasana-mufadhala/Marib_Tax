import { z } from 'zod';

/** Cursor-based pagination metadata for own-data list envelopes. */
export const cursorPageInfoSchema = z
  .object({
    nextCursor: z.string().min(1).nullable(),
    hasMore: z.boolean(),
    pageSize: z.number().int().min(1).max(100),
  })
  .strict();

export type CursorPageInfoValue = z.infer<typeof cursorPageInfoSchema>;

/** Standard cursor-paginated list envelope: items plus pageInfo. */
export function cursorPageSchema<Item extends z.ZodType>(
  itemSchema: Item,
): z.ZodType<{ items: z.infer<Item>[]; pageInfo: CursorPageInfoValue }> {
  return z
    .object({
      items: z.array(itemSchema),
      pageInfo: cursorPageInfoSchema,
    })
    .strict();
}

const optionalPublicRef = z.string().trim().min(1).nullable();

export const requestListItemSchema = z
  .object({
    id: z.uuid(),
    publicRef: optionalPublicRef,
    serviceType: z.string().trim().min(1),
    status: z.string().trim().min(1),
    createdAt: z.string().datetime(),
    submittedAt: z.string().datetime().nullable(),
  })
  .strict();

export const balaghListItemSchema = z
  .object({
    id: z.uuid(),
    publicRef: optionalPublicRef,
    balaghType: z.string().trim().min(1),
    status: z.string().trim().min(1),
    createdAt: z.string().datetime(),
    submittedAt: z.string().datetime().nullable(),
  })
  .strict();

export const notificationReadStatusSchema = z.enum(['unread', 'read']);

export const notificationListItemSchema = z
  .object({
    id: z.uuid(),
    type: z.string().trim().min(1),
    readStatus: notificationReadStatusSchema,
    createdAt: z.string().datetime(),
  })
  .strict();

export const requestListPageSchema = cursorPageSchema(requestListItemSchema);
export const balaghListPageSchema = cursorPageSchema(balaghListItemSchema);

export const notificationInboxPageSchema = z
  .object({
    items: z.array(notificationListItemSchema),
    pageInfo: cursorPageInfoSchema,
    unreadCount: z.number().int().nonnegative().optional(),
  })
  .strict();

export const notificationReadResponseSchema = z
  .object({
    id: z.uuid(),
    readAt: z.string().datetime(),
  })
  .strict();

export type RequestListItem = z.infer<typeof requestListItemSchema>;
export type BalaghListItem = z.infer<typeof balaghListItemSchema>;
export type NotificationListItem = z.infer<typeof notificationListItemSchema>;
export type RequestListPage = z.infer<typeof requestListPageSchema>;
export type BalaghListPage = z.infer<typeof balaghListPageSchema>;
export type NotificationInboxPage = z.infer<typeof notificationInboxPageSchema>;
export type NotificationReadResponse = z.infer<
  typeof notificationReadResponseSchema
>;
