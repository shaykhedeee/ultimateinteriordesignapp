/**
 * Platform Context Resolver
 *
 * Extracts tenant/org/project context from requests safely.
 *
 * Resolution order:
 * 1. Trusted internal headers (`x-organization-id`, `x-project-id`, `x-workspace-id`)
 * 2. Authenticated session/claims (future hook)
 * 3. Path params fallback
 * 4. Graceful `null` defaults for unauthenticated/public routes
 */

const TRUSTED_HEADER_PREFIX = 'x-';

export function resolvePlatformContext({
  req,
  fallbackProjectId,
  fallbackOrganizationId,
  fallbackWorkspaceId
} = {}) {
  const headers = req && typeof req.get === 'function' ? req : { get: () => null };
  const params = req && typeof req.params === 'object' ? req.params : {};
  const query = req && typeof req.query === 'object' ? req.query : {};

  const resolveOrg = () =>
    headers.get(`${TRUSTED_HEADER_PREFIX}organization-id`) ||
    headers.get(`${TRUSTED_HEADER_PREFIX}org-id`) ||
    headers.get(`${TRUSTED_HEADER_PREFIX}tenant-id`) ||
    headers.get('x-organization-id') ||
    req?.user?.organizationId ||
    req?.auth?.organizationId ||
    query?.organizationId ||
    params?.organizationId ||
    fallbackOrganizationId ||
    null;

  const resolveProject = () =>
    headers.get(`${TRUSTED_HEADER_PREFIX}project-id`) ||
    headers.get(`${TRUSTED_HEADER_PREFIX}project`) ||
    req?.user?.projectId ||
    req?.auth?.projectId ||
    query?.projectId ||
    params?.projectId ||
    fallbackProjectId ||
    null;

  const resolveWorkspace = () =>
    headers.get(`${TRUSTED_HEADER_PREFIX}workspace-id`) ||
    headers.get(`${TRUSTED_HEADER_PREFIX}workspace`) ||
    req?.user?.workspaceId ||
    req?.auth?.workspaceId ||
    query?.workspaceId ||
    params?.workspaceId ||
    fallbackWorkspaceId ||
    null;

  const organizationId = resolveOrg();
  const projectId = resolveProject();
  const workspaceId = resolveWorkspace();

  const isAuthenticated = Boolean(
    organizationId ||
    projectId ||
    workspaceId ||
    req?.user ||
    req?.auth
  );

  return {
    organizationId: organizationId || null,
    projectId: projectId || null,
    workspaceId: workspaceId || null,
    isAuthenticated,
    source: {
      headers: {
        organizationId: headers.get('x-organization-id'),
        projectId: headers.get('x-project-id'),
        workspaceId: headers.get('x-workspace-id')
      },
      query,
      params,
      fallbackUsed: {
        organizationId: !fallbackOrganizationId && !headers.get('x-organization-id'),
        projectId: !fallbackProjectId && !headers.get('x-project-id'),
        workspaceId: !fallbackWorkspaceId && !headers.get('x-workspace-id')
      }
    }
  };
}

export const PLATFORM_HEADER_KEYS = Object.freeze([
  'x-organization-id',
  'x-org-id',
  'x-tenant-id',
  'x-project-id',
  'x-workspace-id'
]);
