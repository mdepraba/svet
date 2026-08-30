# Permission System

## Permission Format

**Standard format**: `{resource}.{action}`

Examples:
- `boards.create`
- `boards.read`
- `boards.update`
- `boards.delete`
- `cards.move` (custom action)

## Permission Verification Flow

```typescript
function canUserDoAction(user, action, resource, workspace): boolean {
  // 1. Get organization ID
  const orgId = getOrganizationId(workspace);

  // 2. Owner bypass
  if (isOwner(user, orgId)) return true;

  // 3. Super Admin bypass (with restrictions)
  if (isSuperAdmin(user, orgId)) {
    if (isProtectedAction(action, resource)) return false;
    return true;
  }

  // 4. Get feature for resource
  const feature = getFeatureForResource(resource);
  if (!feature) return false;

  // 5. Check feature is active in workspace
  if (!isFeatureActive(feature, workspace)) return false;

  // 6. Check user has permission in workspace
  const permission = `${resource}.${action}`;
  return userHasPermission(user, permission, workspace);
}
```

## Database Functions

### user_can()

```sql
CREATE FUNCTION user_can(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_workspace_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_is_owner BOOLEAN;
  v_is_super_admin BOOLEAN;
  v_feature_slug TEXT;
  v_is_active BOOLEAN;
  v_permission TEXT;
BEGIN
  -- Get organization
  v_org_id := get_user_organization(p_workspace_id);

  -- Check Owner
  v_is_owner := is_user_owner(p_user_id, p_workspace_id);
  IF v_is_owner THEN RETURN TRUE; END IF;

  -- Check Super Admin
  v_is_super_admin := is_user_super_admin(p_user_id, p_workspace_id);
  IF v_is_super_admin THEN RETURN TRUE; END IF;

  -- Get feature
  SELECT f.slug INTO v_feature_slug
  FROM features f
  JOIN feature_resources fr ON fr.feature_id = f.id
  WHERE fr.resource = p_resource LIMIT 1;

  IF v_feature_slug IS NULL THEN RETURN FALSE; END IF;

  -- Check feature active
  v_is_active := is_feature_active(v_feature_slug, p_workspace_id);
  IF NOT v_is_active THEN RETURN FALSE; END IF;

  -- Check permission
  v_permission := p_resource || '.' || p_action;

  RETURN EXISTS(
    SELECT 1
    FROM get_user_permissions_in_workspace(p_user_id, p_workspace_id)
    WHERE full_name = v_permission
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

### get_user_permissions_in_workspace()

```sql
CREATE FUNCTION get_user_permissions_in_workspace(
  p_user_id UUID,
  p_workspace_id UUID
)
RETURNS TABLE (
  permission_id UUID,
  full_name TEXT,
  resource TEXT,
  action TEXT
) AS $$
  SELECT DISTINCT
    p.id,
    p.full_name,
    p.resource,
    p.action
  FROM permissions p
  JOIN role_permissions rp ON rp.permission_id = p.id
  JOIN user_workspace_roles uwr ON uwr.role_id = rp.role_id
  WHERE uwr.user_id = p_user_id
    AND uwr.workspace_id = p_workspace_id;
$$ LANGUAGE sql STABLE;
```

## Contextual Permissions

**CRITICAL**: Permissions are ONLY valid in the workspace where assigned.

```typescript
// User María
Org: Admin role → permissions: [members.*, projects.*, ...]
Project 1: Editor role → permissions: [boards.create, cards.*]
Project 2: Viewer role → permissions: [*.read]

// Verification
canUserDoAction(maría, 'create', 'boards', org) → false (feature not active)
canUserDoAction(maría, 'create', 'boards', project1) → true ✓
canUserDoAction(maría, 'create', 'boards', project2) → false (only read)
```

## Effective Permissions (Multiple Roles)

When a user has multiple roles in same workspace, permissions are **UNION** of all:

```typescript
User has roles: [Editor, Developer] in Project X

Editor: [boards.create, boards.read, cards.create]
Developer: [cards.update, cards.delete, time_entries.*]

Effective: UNION
= [boards.create, boards.read, cards.create, cards.update, cards.delete, time_entries.*]
```

## Permission Assignment Restrictions

```typescript
function canAssignRole(assigner, target, role, workspace): boolean {
  // Owner can assign anything
  if (assigner.isOwner()) return true;

  // Super Admin restrictions
  if (assigner.isSuperAdmin()) {
    if (target.isOwner()) return false;
    if (target.isSuperAdmin()) return false;
    if (role.slug === 'super_admin') return false;
    return true;
  }

  // Normal user with permission
  if (assigner.hasPermission('members.assign_roles')) {
    if (target.isOwner()) return false;
    if (target.isSuperAdmin()) return false;
    if (role.slug === 'super_admin') return false;
    return true;
  }

  return false;
}
```

## RLS Policies for Permissions

```sql
-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON user_workspace_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only authorized users can assign roles
CREATE POLICY "Authorized users can assign roles"
ON user_workspace_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_can(auth.uid(), 'assign_roles', 'members', workspace_id)
);
```
