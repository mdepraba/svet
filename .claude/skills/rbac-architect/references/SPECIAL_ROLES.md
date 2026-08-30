# Special Roles: Owner and Super Admin

## Critical Difference from Normal Roles

```
Normal Roles = Sets of permissions
Special Roles = Bypass logic with special restrictions
```

**Owner and Super Admin are NOT in the `roles` table.**

## Owner (Propietario)

### Definition

The user who created the organization. Has **absolute and untouchable control**.

### Identification

```sql
-- Owner is in workspaces.owner_id
SELECT owner_id
FROM workspaces
WHERE id = (
  SELECT COALESCE(parent_id, id)
  FROM workspaces
  WHERE id = :current_workspace_id
)
```

### Owner Privileges

1. **Global Absolute Access**
   - Total access to organization
   - Total access to ALL projects in organization
   - No need to be added explicitly to projects
   - Complete permission check bypass

2. **Control over Super Admins**
   - Can assign Super Admin role
   - Can remove Super Admin role
   - Can modify Super Admin permissions
   - Super Admins CANNOT touch Owner

3. **Control over Normal Users**
   - Can assign/remove any role
   - Can modify any user permissions
   - Can delete users from organization

4. **Organization Management**
   - Can delete entire organization
   - Can transfer ownership to another user
   - Can modify critical organization configuration

5. **Permissions-Management Feature**
   - Has ALL permissions of this feature ALWAYS active
   - Regardless of explicit assignment

### Owner Restrictions

- **Unique** per organization (only one Owner)
- **Cannot be removed** by anyone (except transfer)
- **Cannot remove self** (only transfer ownership)

### Verification Functions

```sql
CREATE FUNCTION is_user_owner(p_user_id UUID, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT owner_id = p_user_id
  FROM workspaces
  WHERE id = get_user_organization(p_workspace_id)
    AND type = 'organization';
$$ LANGUAGE sql STABLE;
```

---

## Super Admin (Super Administrador)

### Definition

User with elevated privileges but **limited compared to Owner**.

### Identification

```sql
-- Super Admin table
CREATE TABLE organization_super_admins (
  organization_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (organization_id, user_id),

  CONSTRAINT super_admin_only_in_org CHECK (
    organization_id IN (
      SELECT id FROM workspaces WHERE type = 'organization'
    )
  )
);
```

### Super Admin Privileges

1. **Global Access**
   - Total access to organization
   - Total access to ALL projects in organization
   - No need to be added explicitly to projects
   - Bypass of normal permission checks

2. **Control over Normal Users**
   - Can assign/remove normal roles
   - Can modify normal user permissions
   - Can invite/delete normal users

3. **Permissions-Management Feature**
   - Has ALL permissions of this feature active
   - Can manage roles and permissions

### Super Admin Restrictions

1. **CANNOT touch Owner**
   - Cannot remove Owner
   - Cannot modify Owner permissions
   - Cannot change Owner configuration

2. **CANNOT touch other Super Admins**
   - Cannot remove other Super Admins
   - Cannot modify other Super Admin permissions
   - Cannot affect their Super Admin status

3. **CANNOT self-remove**
   - Cannot remove own Super Admin role
   - Only Owner can remove them

4. **CANNOT delete organization**
   - Only Owner can delete organization

5. **Can be removed by Owner**
   - Owner can revoke Super Admin role
   - Owner can modify their permissions

### Verification Functions

```sql
CREATE FUNCTION is_user_super_admin(p_user_id UUID, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM organization_super_admins
    WHERE organization_id = get_user_organization(p_workspace_id)
      AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE;
```

---

## Power Hierarchy

```
┌─────────────────────────────────────────┐
│  OWNER                                  │
│  - Absolute control                     │
│  - Untouchable                          │
│  - Can do EVERYTHING                    │
│  - Unique                               │
└─────────────────────────────────────────┘
              ↓ can manage
┌─────────────────────────────────────────┐
│  SUPER ADMIN                            │
│  - Total control EXCEPT Owner           │
│  - CANNOT touch Owner                   │
│  - CANNOT touch other Super Admins      │
│  - Can be multiple                      │
└─────────────────────────────────────────┘
              ↓ can manage
┌─────────────────────────────────────────┐
│  NORMAL USERS                           │
│  - Normal roles (permission sets)       │
│  - Contextual                           │
│  - Can have management permissions      │
│    but NEVER touch Owner/Super Admins   │
└─────────────────────────────────────────┘
```

## Interaction Permission Matrix

| Action | Owner can | Super Admin can | Normal can |
|--------|-----------|-----------------|------------|
| Modify Owner | ❌ No (only transfer) | ❌ No | ❌ No |
| Assign Super Admin | ✅ Yes | ❌ No | ❌ No |
| Remove Super Admin | ✅ Yes | ❌ No (not self) | ❌ No |
| Modify Super Admin | ✅ Yes | ❌ No | ❌ No |
| Assign normal roles | ✅ Yes | ✅ Yes | ✅ Yes (if has permission) |
| Remove normal roles | ✅ Yes | ✅ Yes | ✅ Yes (if has permission) |
| Delete organization | ✅ Yes | ❌ No | ❌ No |
| Access any project | ✅ Yes | ✅ Yes | ❌ No |

## Protected Actions (Super Admin Cannot Do)

```typescript
const PROTECTED_ACTIONS = {
  // Related to Owner
  'users.remove': (target) => target.isOwner(),
  'users.modify': (target) => target.isOwner(),

  // Related to Super Admins
  'roles.assign': (target, role) => {
    return target.isOwner() ||
           (target.isSuperAdmin() && role !== 'remove');
  },
  'roles.remove': (target) => {
    return target.isOwner() || target.isSuperAdmin();
  },

  // Super Admin role
  'super_admin.assign': () => true,  // Only Owner
  'super_admin.remove': () => true,  // Only Owner

  // Organization
  'organization.delete': () => true,  // Only Owner
  'organization.transfer': () => true,  // Only Owner
};
```

## Project Creation

**CRITICAL**: NO special roles at project level.

### Who Can Create Projects

```typescript
Can create projects:
├─ Owner of organization (always)
├─ Super Admin of organization (always)
└─ Users with "projects.create" permission in organization
```

### What Happens When Creating Project

```typescript
1. Project is created (parent_id = org_id)
2. Creator gets "Admin" role (NORMAL role, not special)
3. Creator has total control of project
4. BUT is NOT a "Project Owner" (concept doesn't exist)
5. Can be removed by Owner/Super Admin
```

---

## Assignment Examples

### Assigning Super Admin (Only Owner)

```typescript
// Owner assigns Super Admin
async function assignSuperAdmin(
  ownerId: string,
  userId: string,
  orgId: string
) {
  // Verify requester is Owner
  if (!isOwner(ownerId, orgId)) {
    throw new Error('Only Owner can assign Super Admin');
  }

  // Verify organization context
  const workspace = await getWorkspace(orgId);
  if (workspace.type !== 'organization') {
    throw new Error('Super Admin only exists at organization level');
  }

  // Assign
  await db.insert('organization_super_admins', {
    organization_id: orgId,
    user_id: userId,
    assigned_by: ownerId,
    assigned_at: new Date()
  });
}
```

### Removing Super Admin (Only Owner)

```typescript
async function removeSuperAdmin(
  ownerId: string,
  userId: string,
  orgId: string
) {
  // Verify requester is Owner
  if (!isOwner(ownerId, orgId)) {
    throw new Error('Only Owner can remove Super Admin');
  }

  // Remove
  await db.delete('organization_super_admins', {
    organization_id: orgId,
    user_id: userId
  });
}
```

---

## Summary

| Aspect | Owner | Super Admin |
|--------|-------|-------------|
| **Scope** | Organization only | Organization only |
| **Identification** | `workspaces.owner_id` | `organization_super_admins` table |
| **Count** | One per organization | Multiple allowed |
| **Bypass** | Complete | Complete (with restrictions) |
| **Can modify Owner** | No (only transfer) | No |
| **Can modify Super Admin** | Yes | No |
| **Can assign Super Admin** | Yes | No |
| **Can delete org** | Yes | No |
| **Project access** | Automatic to all | Automatic to all |

**Key Takeaway**: Owner is **absolute**, Super Admin is **powerful but restricted**.
