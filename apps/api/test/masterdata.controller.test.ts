import { describe, expect, it } from 'vitest';
import {
  PERMISSION_METADATA,
  PREDICATES_METADATA,
} from '../src/authz/authorization.decorators.js';
import { MasterdataController } from '../src/masterdata/masterdata.controller.js';

const endpointPolicy = {
  readMe: ['taxpayer.profile.read', ['OWNERSHIP']],
  readActivity: ['taxpayer.profile.read', ['OWNERSHIP']],
} as const;

describe('masterdata controller authorization contract', () => {
  it.each(Object.entries(endpointPolicy))(
    'declares the exact owned-read policy for %s',
    (method, [permission, predicates]) => {
      const handler =
        MasterdataController.prototype[
          method as keyof typeof MasterdataController.prototype
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
