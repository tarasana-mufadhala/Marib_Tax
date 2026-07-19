import { describe, expect, it } from 'vitest';
import {
  PERMISSION_METADATA,
  PREDICATES_METADATA,
} from '../src/authz/authorization.decorators.js';
import { TaxpayerRegistryController } from '../src/registry/taxpayer-registry.controller.js';

const endpointPolicy = {
  readMe: ['taxpayer.profile.read', ['OWNERSHIP']],
  readById: ['taxpayer.profile.read', ['OWNERSHIP']],
} as const;

describe('taxpayer registry controller authorization contract', () => {
  it.each(Object.entries(endpointPolicy))(
    'declares the exact owned-read policy for %s',
    (method, [permission, predicates]) => {
      const handler =
        TaxpayerRegistryController.prototype[
          method as keyof typeof TaxpayerRegistryController.prototype
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
