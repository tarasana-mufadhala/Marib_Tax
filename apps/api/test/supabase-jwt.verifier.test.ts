import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { SupabaseJwtVerifier } from '../src/authn/supabase-jwt.verifier.js';

const issuer = 'https://project.example/auth/v1';
const audience = 'authenticated';
let verifier: SupabaseJwtVerifier;
let privateKey: CryptoKey;

beforeAll(async () => {
  const keys = await generateKeyPair('RS256', { extractable: true });
  privateKey = keys.privateKey;
  const publicJwk = await exportJWK(keys.publicKey);
  verifier = new SupabaseJwtVerifier(
    { issuer, audience },
    createLocalJWKSet({ keys: [{ ...publicJwk, alg: 'RS256', kid: 'test' }] }),
  );
});

async function token(
  overrides: {
    issuer?: string;
    audience?: string;
    subject?: string;
    expiration?: string;
    key?: CryptoKey;
  } = {},
): Promise<string> {
  const jwt = new SignJWT({ user_metadata: { permissions: ['admin.*'] } })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(overrides.issuer ?? issuer)
    .setAudience(overrides.audience ?? audience)
    .setIssuedAt()
    .setExpirationTime(overrides.expiration ?? '5m');
  if (overrides.subject !== '')
    jwt.setSubject(overrides.subject ?? '00000000-0000-4000-8000-000000000001');
  return jwt.sign(overrides.key ?? privateKey);
}

describe('Supabase JWT verifier', () => {
  it('trusts only verified sub and ignores user_metadata permissions', async () => {
    await expect(verifier.verify(await token())).resolves.toEqual({
      authUserId: '00000000-0000-4000-8000-000000000001',
    });
  });

  it.each([
    ['wrong issuer', { issuer: 'https://wrong.example/auth/v1' }],
    ['wrong audience', { audience: 'wrong' }],
    ['expired', { expiration: '0s' }],
    ['missing sub', { subject: '' }],
  ])(
    'rejects %s without exposing verification details',
    async (_name, options) => {
      await expect(verifier.verify(await token(options))).rejects.toMatchObject(
        { status: 401 },
      );
    },
  );

  it('rejects an invalid signature', async () => {
    const other = await generateKeyPair('RS256');
    await expect(
      verifier.verify(await token({ key: other.privateKey })),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects malformed tokens', async () => {
    await expect(verifier.verify('not-a-jwt')).rejects.toMatchObject({
      status: 401,
    });
  });
});
