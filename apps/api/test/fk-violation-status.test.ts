/* eslint-disable @typescript-eslint/explicit-function-return-type -- مضيف Express مصغّر للاختبار */
import { describe, expect, it } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { ApiExceptionFilter } from '../src/http/api-exception.filter.js';

function run(exception: unknown): { status: number; body: unknown } {
  const out = { status: 0, body: undefined as unknown };
  const response = {
    setHeader: (): void => undefined,
    status: (s: number) => {
      out.status = s;
      return { json: (b: unknown): void => void (out.body = b) };
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ header: (): undefined => undefined, method: 'POST', url: '/x' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  new ApiExceptionFilter().catch(exception, host);
  return out;
}

describe('ApiExceptionFilter foreign key violations', () => {
  it('maps a Postgres FK violation to 422', () => {
    const err = Object.assign(new Error('violates foreign key'), { code: '23503' });
    expect(run(err).status).toBe(422);
  });

  it('keeps other database errors as 500', () => {
    const err = Object.assign(new Error('boom'), { code: '42P01' });
    expect(run(err).status).toBe(500);
  });
});
