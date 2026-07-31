import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { authorizationPredicates, permissionCodes } from '../src/index.js';

interface Operation {
  'x-permission'?: string;
  'x-authorization-predicates'?: string[];
  security?: unknown[];
  parameters?: Array<{ $ref?: string; name?: string; in?: string }>;
  responses?: Record<string, { $ref?: string }>;
}

interface OpenApiDocument {
  paths: Record<string, Record<string, Operation>>;
  components: {
    schemas: Record<string, unknown>;
    parameters: Record<string, unknown>;
  };
}

const source = readFileSync(
  fileURLToPath(new URL('../openapi/marib-tax.v1.yaml', import.meta.url)),
  'utf8',
);
const document = load(source) as OpenApiDocument;

const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/otp/request',
  '/api/v1/auth/otp/verify',
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/password/reset/request',
  '/api/v1/auth/password/reset/confirm',
  '/api/v1/auth/refresh',
];

const OWN_DATA_PATHS = [
  '/api/v1/me/requests',
  '/api/v1/me/balaghs',
  '/api/v1/me/notifications',
  '/api/v1/me/notifications/{id}/read',
];

function operationsOf(path: string): Operation[] {
  const pathItem = document.paths[path];
  if (!pathItem) throw new Error(`missing path ${path}`);
  return Object.values(pathItem).filter(
    (value) => value && typeof value === 'object' && !Array.isArray(value),
  );
}

describe('OpenAPI authentication group', () => {
  it('publishes every baseline authentication path', () => {
    for (const path of [...PUBLIC_AUTH_PATHS, '/api/v1/auth/logout']) {
      expect(document.paths).toHaveProperty(path);
    }
  });

  it('marks public operations with security: [] and no x-permission', () => {
    for (const path of PUBLIC_AUTH_PATHS) {
      for (const operation of operationsOf(path)) {
        expect(operation.security, path).toEqual([]);
        expect(operation['x-permission'], path).toBeUndefined();
      }
    }
  });

  it('keeps logout bearer-authenticated without a business permission', () => {
    const [logout] = operationsOf('/api/v1/auth/logout');
    expect(logout?.security).toBeUndefined();
    expect(logout?.['x-permission']).toBeUndefined();
    expect(logout?.responses?.['401']?.$ref).toBe(
      '#/components/responses/Unauthenticated',
    );
    expect(logout?.responses?.['204']).toBeDefined();
  });

  it('never accepts an email field in authentication schemas', () => {
    const authSchemaNames = Object.keys(document.components.schemas).filter(
      (name) =>
        /^(Otp|Register|Login|Password|Refresh|TokenPair|Phone)/.test(name),
    );
    expect(authSchemaNames.length).toBeGreaterThan(0);
    for (const name of authSchemaNames) {
      const schema = document.components.schemas[name] as {
        properties?: Record<string, unknown>;
      };
      expect(JSON.stringify(schema.properties ?? {}), name).not.toContain(
        'email',
      );
    }
  });
});

describe('OpenAPI taxpayer own-data group', () => {
  it('declares an approved catalog permission on every operation', () => {
    const expected: Record<string, string> = {
      '/api/v1/me/requests': 'request.read',
      '/api/v1/me/balaghs': 'balagh.read',
      '/api/v1/me/notifications': 'notification.read',
      '/api/v1/me/notifications/{id}/read': 'notification.mark_read',
    };
    for (const [path, permission] of Object.entries(expected)) {
      const [operation] = operationsOf(path);
      expect(operation?.['x-permission'], path).toBe(permission);
      expect(permissionCodes).toContain(permission);
    }
  });

  it('uses only approved authorization predicates', () => {
    for (const path of OWN_DATA_PATHS) {
      for (const operation of operationsOf(path)) {
        const predicates = operation['x-authorization-predicates'];
        expect(predicates, path).toBeDefined();
        expect(predicates, path).toContain('OWNERSHIP');
        for (const predicate of predicates ?? []) {
          expect(authorizationPredicates).toContain(predicate);
        }
      }
    }
  });

  it('requires 401 and 403 responses on every own-data operation', () => {
    for (const path of OWN_DATA_PATHS) {
      for (const operation of operationsOf(path)) {
        expect(operation.responses?.['401']?.$ref, path).toBe(
          '#/components/responses/Unauthenticated',
        );
        expect(operation.responses?.['403']?.$ref, path).toBe(
          '#/components/responses/Forbidden',
        );
      }
    }
  });

  it('paginates list endpoints with the shared cursor parameters', () => {
    for (const path of [
      '/api/v1/me/requests',
      '/api/v1/me/balaghs',
      '/api/v1/me/notifications',
    ]) {
      const [operation] = operationsOf(path);
      const refs = (operation?.parameters ?? []).map(
        (parameter) => parameter.$ref,
      );
      expect(refs, path).toContain('#/components/parameters/Cursor');
      expect(refs, path).toContain('#/components/parameters/Limit');
    }
    expect(document.components.parameters).toHaveProperty('Cursor');
    expect(document.components.parameters).toHaveProperty('Limit');
    expect(document.components.schemas).toHaveProperty('CursorPageInfo');
  });
});
