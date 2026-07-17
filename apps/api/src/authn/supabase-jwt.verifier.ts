import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type {
  AccessTokenVerifier,
  VerifiedAuthIdentity,
} from './authentication.contracts.js';

export interface SupabaseJwtVerifierConfig {
  issuer: string;
  audience: string;
}

@Injectable()
export class SupabaseJwtVerifier implements AccessTokenVerifier {
  private readonly jwks: JWTVerifyGetKey;
  constructor(
    private readonly config: SupabaseJwtVerifierConfig,
    keyResolver?: JWTVerifyGetKey,
  ) {
    const issuer = new URL(config.issuer);
    if (issuer.protocol !== 'https:')
      throw new Error('Auth issuer must use HTTPS.');
    this.jwks =
      keyResolver ??
      createRemoteJWKSet(
        new URL(`${config.issuer.replace(/\/$/, '')}/.well-known/jwks.json`),
        { cooldownDuration: 30_000, cacheMaxAge: 600_000 },
      );
  }
  async verify(accessToken: string): Promise<VerifiedAuthIdentity> {
    try {
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['RS256', 'ES256'],
      });
      if (typeof payload.sub !== 'string' || payload.sub.length === 0)
        throw new UnauthorizedException();
      return Object.freeze({ authUserId: payload.sub });
    } catch {
      throw new UnauthorizedException();
    }
  }
}
