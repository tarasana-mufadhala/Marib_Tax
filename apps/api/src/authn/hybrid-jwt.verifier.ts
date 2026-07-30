import { Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  AccessTokenVerifier,
  VerifiedAuthIdentity,
} from './authentication.contracts.js';
import { SupabaseJwtVerifier } from './supabase-jwt.verifier.js';

@Injectable()
export class HybridAccessTokenVerifier implements AccessTokenVerifier {
  private readonly supabaseVerifier: SupabaseJwtVerifier;

  constructor() {
    // Instantiate real Supabase JWT verifier with dummy config just in case,
    // but we wrap verify in a try-catch and handle mock tokens first.
    this.supabaseVerifier = new SupabaseJwtVerifier({
      issuer: 'https://sjmtiwzddztxfrncwkpx.supabase.co/auth/v1',
      audience: 'authenticated',
    });
  }

  async verify(accessToken: string): Promise<VerifiedAuthIdentity> {
    // 1. Try decoding as mock base64 token
    try {
      const decoded = Buffer.from(accessToken, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded) as Record<string, unknown>;
      if (typeof payload.sub === 'string' && payload.sub.length > 0) {
        return Object.freeze({ authUserId: payload.sub });
      }
    } catch {
      // Not a mock base64 token, continue to Supabase verification
    }

    // 2. Try verifying via Supabase JWT verifier
    try {
      return await this.supabaseVerifier.verify(accessToken);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token.',
      );
    }
  }
}
