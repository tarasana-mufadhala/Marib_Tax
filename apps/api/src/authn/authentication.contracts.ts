import type { PermissionCode } from '@marib-tax/contracts';

export interface VerifiedAuthIdentity {
  authUserId: string;
}
export interface AccessTokenVerifier {
  verify(accessToken: string): Promise<VerifiedAuthIdentity>;
}
export interface ResolvedActorProfile {
  actorId: string;
  permissions: readonly PermissionCode[];
  roleActive: boolean;
  assignmentActive: boolean;
}
export interface ActorProfileRepository {
  findActiveByAuthUserId(
    authUserId: string,
  ): Promise<ResolvedActorProfile | null>;
}
export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
export const ACTOR_PROFILE_REPOSITORY = Symbol('ACTOR_PROFILE_REPOSITORY');
export const CURRENT_ACTOR = Symbol('CURRENT_ACTOR');
