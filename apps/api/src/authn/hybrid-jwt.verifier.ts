import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import type {
  AccessTokenVerifier,
  VerifiedAuthIdentity,
} from './authentication.contracts.js';
import { SupabaseJwtVerifier } from './supabase-jwt.verifier.js';

/**
 * Verifies Supabase-issued access tokens.
 * Primary: HS256 with the project's legacy JWT secret (SUPABASE_JWT_SECRET).
 * Fallback: asymmetric keys published at the project's JWKS endpoint.
 */
@Injectable()
export class HybridAccessTokenVerifier implements AccessTokenVerifier {
  private readonly issuer: string;
  private readonly audience = 'authenticated';
  private readonly hs256Key: Uint8Array | null;
  private readonly jwksVerifier: SupabaseJwtVerifier;

  constructor(configService: ConfigService) {
    const supabaseUrl = (
      configService.get<string>('SUPABASE_URL') ??
      process.env.SUPABASE_URL ??
      ''
    ).replace(/\/$/, '');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL must be configured for token verification.');
    }
    this.issuer = `${supabaseUrl}/auth/v1`;

    const jwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET') ??
      process.env.SUPABASE_JWT_SECRET ??
      '';
    this.hs256Key =
      jwtSecret.length > 0 ? new TextEncoder().encode(jwtSecret) : null;

    this.jwksVerifier = new SupabaseJwtVerifier({
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  async verify(accessToken: string): Promise<VerifiedAuthIdentity> {
    // 1. HS256 with the project's JWT secret (current key setup)
    if (this.hs256Key) {
      try {
        const { payload } = await jwtVerify(accessToken, this.hs256Key, {
          issuer: this.issuer,
          audience: this.audience,
          algorithms: ['HS256'],
        });
        if (typeof payload.sub === 'string' && payload.sub.length > 0) {
          return Object.freeze({ authUserId: payload.sub });
        }
      } catch {
        // Not a valid HS256 token for this project; try JWKS below.
      }
    }

    // 2. Asymmetric keys via JWKS (projects migrated to RS256/ES256)
    try {
      return await this.jwksVerifier.verify(accessToken);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token.',
      );
    }
  }
}
