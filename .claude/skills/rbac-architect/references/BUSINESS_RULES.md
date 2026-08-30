# Business Rules Summary

Quick reference for all business rules from concepto-base.md.

## Workspace Rules

**RN-W01**: Organization MUST have owner_id
**RN-W02**: Organization CANNOT have parent_id
**RN-W03**: Project MUST have parent_id
**RN-W04**: Slug unique within container (parent_id, slug)
**RN-W05**: Deleting organization cascades to projects

## Feature Rules

**RN-F01**: `permissions-management` auto-activates on workspace creation
**RN-F02**: Mandatory features cannot be disabled
**RN-F03**: Feature only available if in `workspace_features` with `enabled=true`
**RN-F04**: NO feature inheritance between workspaces
**RN-F05**: Any feature can be activated in any workspace type
**RN-F06**: Features define own resources and permissions

## Permission Rules

**RN-P01**: Permissions specific to features, only apply where feature active
**RN-P02**: Permission format: `{resource}.{action}`
**RN-P03**: Permissions are contextual (workspace-specific)
**RN-P04**: NO permission inheritance between workspaces (except Owner/Super Admin)
**RN-P05**: Effective permissions = UNION of all roles
**RN-P06**: Verification order: Owner → Super Admin → Feature Active → Permission

## Role Rules

**RN-R01**: Normal roles are permission sets without special logic
**RN-R02**: User can have multiple roles in same workspace
**RN-R03**: Roles do NOT inherit between workspaces
**RN-R04**: Roles assigned via `user_workspace_roles`
**RN-R05**: Roles have scope (organization/project)

## Owner Rules

**RN-O01**: Owner = `workspaces.owner_id` of organization
**RN-O02**: Owner only exists at organization level
**RN-O03**: Owner has automatic total access to org and ALL projects
**RN-O04**: Owner has complete permission bypass
**RN-O05**: Owner can assign/remove Super Admins
**RN-O06**: Owner can modify any user including Super Admins
**RN-O07**: Owner cannot remove self (only transfer)
**RN-O08**: Owner can delete entire organization
**RN-O09**: Owner has all `permissions-management` permissions always
**RN-O10**: Nobody can remove/modify Owner except Owner

## Super Admin Rules

**RN-SA01**: Super Admin only exists at organization level
**RN-SA02**: Identified in `organization_super_admins` table
**RN-SA03**: Only Owner can assign Super Admins
**RN-SA04**: Multiple Super Admins allowed per organization
**RN-SA05**: Super Admin has total access to org and ALL projects
**RN-SA06**: Super Admin bypasses normal permission checks
**RN-SA07**: Super Admin CANNOT:
- Modify Owner
- Remove Owner
- Assign Super Admin to others
- Remove Super Admin from others
- Modify other Super Admins
- Remove own Super Admin role
- Delete organization

**RN-SA08**: Super Admin can manage normal users without restrictions
**RN-SA09**: Owner can remove Super Admin anytime

## Normal User Rules

**RN-UN01**: Normal users have permissions per workspace roles
**RN-UN02**: Users with management permissions can manage other normal users
**RN-UN03**: Normal users NEVER can:
- Modify Owner
- Modify Super Admins
- Assign Super Admin role
- Access workspaces without roles

**RN-UN04**: Normal users only see features with at least one permission
**RN-UN05**: Permissions strictly contextual to workspace

## Project Creation Rules

**RN-CP01**: Can create projects: Owner, Super Admin, users with `projects.create`
**RN-CP02**: Creator gets "Admin" role (normal, not special)
**RN-CP03**: NO "Project Owner" concept
**RN-CP04**: Project created with `parent_id` to organization
**RN-CP05**: `permissions-management` auto-activates
**RN-CP06**: Owner/Super Admin have automatic access to new project

## Visibility Rules

**RN-V01**: Users only see features with at least one permission
**RN-V02**: Owner/Super Admin see ALL active features
**RN-V03**: No permissions = no visibility in menu
**RN-V04**: Visibility evaluated per feature
**RN-V05**: Individual actions shown per specific permissions

## Permissions-Management Rules

**RN-PM01**: Mandatory, cannot be disabled
**RN-PM02**: Org level includes project management permissions
**RN-PM03**: Project level excludes project management
**RN-PM04**: Owner has all permissions always active
**RN-PM05**: Super Admin has all permissions always active (with restrictions)
**RN-PM06**: Normal users have NO permissions by default
**RN-PM07**: Permissions must be explicitly assigned
**RN-PM08**: Users with management permissions CANNOT:
- Modify Owner
- Modify Super Admins
- Assign Super Admin role

## Ownership Transfer Rules

**RN-TO01**: Only current Owner can transfer ownership
**RN-TO02**: Transfer must be to existing organization user
**RN-TO03**: Transfer process:
1. Update `workspaces.owner_id`
2. Previous Owner becomes normal user
3. New Owner gets all privileges

**RN-TO04**: Transfer is irreversible without another transfer
**RN-TO05**: Owner cannot transfer to self (no-op)

## Deletion Rules

**RN-E01**: Only Owner can delete organization
**RN-E02**: Deleting organization cascades:
- All projects
- All role assignments
- All feature activations
- All Super Admins

**RN-E03**: Owner/Super Admins can delete projects
**RN-E04**: Users with specific permission can delete projects
**RN-E05**: Deleting project cascades:
- All role assignments
- All feature activations
- All project data

---

**Critical Takeaways:**

1. **Independence**: No inheritance between workspaces
2. **Explicit**: Everything must be explicitly activated/assigned
3. **Contextual**: Permissions only apply in specific workspace
4. **Hierarchy**: Owner > Super Admin > Normal Users
5. **Protected**: Owner is untouchable, Super Admin has limits
