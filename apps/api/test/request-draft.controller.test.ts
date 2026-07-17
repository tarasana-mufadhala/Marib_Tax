import { describe, expect, it } from 'vitest';
import {
  PERMISSION_METADATA,
  PREDICATES_METADATA,
} from '../src/authz/authorization.decorators.js';
import { RequestDraftController } from '../src/requests/request-draft.controller.js';

const endpointPolicy = {
  create: ['request.draft.create', ['OWNERSHIP']],
  read: ['request.read', ['OWNERSHIP']],
  edit: ['request.draft.edit', ['OWNERSHIP', 'RESOURCE_STATE']],
  submit: ['request.submit', ['OWNERSHIP', 'RESOURCE_STATE']],
} as const;

describe('request draft controller authorization contract', () => {
  it.each(Object.entries(endpointPolicy))(
    'declares the exact API-03 policy for %s',
    (method, [permission, predicates]) => {
      const handler =
        RequestDraftController.prototype[
          method as keyof typeof RequestDraftController.prototype
        ];
      expect(Reflect.getMetadata(PERMISSION_METADATA, handler)).toBe(
        permission,
      );
      expect(Reflect.getMetadata(PREDICATES_METADATA, handler)).toEqual(
        predicates,
      );
    },
  );
});
