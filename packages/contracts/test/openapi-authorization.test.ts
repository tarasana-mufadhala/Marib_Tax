import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

interface Operation {
  'x-permission'?: string;
  security?: unknown[];
  responses?: Record<string, { $ref?: string }>;
}

interface OpenApiDocument {
  paths: Record<string, Record<string, Operation>>;
  components: { responses: Record<string, unknown> };
  security?: unknown[];
}

const source = readFileSync(
  fileURLToPath(new URL('../openapi/marib-tax.v1.yaml', import.meta.url)),
  'utf8',
);
const document = load(source) as OpenApiDocument;

describe('OpenAPI authorization response contract', () => {
  it('declares reusable safe authentication and authorization responses', () => {
    expect(document.components.responses).toHaveProperty('Unauthenticated');
    expect(document.components.responses).toHaveProperty('Forbidden');
  });

  it('requires 401 and 403 responses on every protected business operation', () => {
    const protectedOperations = Object.values(document.paths)
      .flatMap((pathItem) => Object.values(pathItem))
      .filter((operation) => operation['x-permission'] !== undefined);

    expect(protectedOperations.length).toBeGreaterThan(0);
    expect(document.security).toEqual([{ bearerAuth: [] }]);
    for (const operation of protectedOperations) {
      expect(operation.security).not.toEqual([]);
      expect(operation.responses?.['401']?.$ref).toBe(
        '#/components/responses/Unauthenticated',
      );
      expect(operation.responses?.['403']?.$ref).toBe(
        '#/components/responses/Forbidden',
      );
    }
  });
});
