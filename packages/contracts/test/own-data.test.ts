import { describe, expect, it } from 'vitest';
import {
  balaghListPageSchema,
  cursorPageInfoSchema,
  notificationInboxPageSchema,
  notificationListItemSchema,
  notificationReadResponseSchema,
  requestListItemSchema,
  requestListPageSchema,
} from '../src/own-data.js';
import type { CursorPage } from '../src/index.js';

const pageInfo = { nextCursor: null, hasMore: false, pageSize: 20 };

const requestItem = {
  id: '00000000-0000-4000-8000-000000000001',
  publicRef: 'REQ-2026-0001',
  serviceType: 'activity_address_change',
  status: 'draft',
  createdAt: '2026-07-01T10:00:00.000Z',
  submittedAt: null,
};

describe('cursor page envelope', () => {
  it('accepts a valid page info with a null next cursor', () => {
    expect(cursorPageInfoSchema.parse(pageInfo)).toEqual(pageInfo);
  });

  it('accepts a page info carrying an opaque next cursor', () => {
    const value = cursorPageInfoSchema.parse({
      ...pageInfo,
      nextCursor: 'eyJpZCI6IjEyMyJ9',
      hasMore: true,
    });
    expect(value.hasMore).toBe(true);
  });

  it.each([
    ['missing hasMore', { nextCursor: null, pageSize: 20 }],
    ['extra key', { ...pageInfo, totalItems: 42 }],
    ['pageSize above 100', { ...pageInfo, pageSize: 101 }],
    ['pageSize zero', { ...pageInfo, pageSize: 0 }],
  ])('rejects page info with %s', (_name, value) => {
    expect(() => cursorPageInfoSchema.parse(value)).toThrow();
  });

  it('wraps request items in the standard envelope', () => {
    const value = requestListPageSchema.parse({
      items: [requestItem],
      pageInfo,
    });
    expect(value.items).toHaveLength(1);
    expect(value.pageInfo.nextCursor).toBeNull();
  });

  it('rejects an envelope with an unknown key', () => {
    expect(() =>
      requestListPageSchema.parse({ items: [], pageInfo, totalItems: 3 }),
    ).toThrow();
  });

  it('matches the exported generic CursorPage type', () => {
    const page: CursorPage<{ id: string }> = {
      items: [{ id: 'x' }],
      pageInfo,
    };
    expect(page.pageInfo.pageSize).toBe(20);
  });
});

describe('own-data list items', () => {
  it('accepts request and balagh summaries with nullable public refs', () => {
    expect(requestListItemSchema.parse(requestItem)).toEqual(requestItem);
    const balaghPage = balaghListPageSchema.parse({
      items: [
        {
          id: requestItem.id,
          publicRef: null,
          balaghType: 'activity_stoppage',
          status: 'submitted',
          createdAt: requestItem.createdAt,
          submittedAt: requestItem.createdAt,
        },
      ],
      pageInfo,
    });
    expect(balaghPage.items[0]?.publicRef).toBeNull();
  });

  it('rejects a request item with extra fields', () => {
    expect(() =>
      requestListItemSchema.parse({ ...requestItem, payload: {} }),
    ).toThrow();
  });

  it('validates notification read status and inbox unread count', () => {
    const item = {
      id: requestItem.id,
      type: 'due_reminder',
      readStatus: 'unread',
      createdAt: requestItem.createdAt,
    };
    expect(notificationListItemSchema.parse(item)).toEqual(item);
    expect(() =>
      notificationListItemSchema.parse({ ...item, readStatus: 'archived' }),
    ).toThrow();

    const inbox = notificationInboxPageSchema.parse({
      items: [item],
      pageInfo,
      unreadCount: 7,
    });
    expect(inbox.unreadCount).toBe(7);
    // unreadCount is optional.
    expect(
      notificationInboxPageSchema.parse({ items: [], pageInfo }),
    ).not.toHaveProperty('unreadCount');
  });

  it('validates the mark-read response', () => {
    expect(
      notificationReadResponseSchema.parse({
        id: requestItem.id,
        readAt: requestItem.createdAt,
      }),
    ).toMatchObject({ id: requestItem.id });
  });
});
