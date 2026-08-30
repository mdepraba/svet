# Workspace Architecture

## Table of Contents
- [Organization (Root Workspace)](#organization-root-workspace)
- [Project (Child Workspace)](#project-child-workspace)
- [Independence Between Workspaces](#independence-between-workspaces)
- [Workspace Rules](#workspace-rules)

---

## Organization (Root Workspace)

**Definition**: The organization is the root workspace that acts as the main container.

### Characteristics

```
Organization
├─ Top level of hierarchy
├─ Contains projects
├─ Has an Owner (creator)
├─ Can have Super Admins
├─ Can have any feature active
├─ Typically has business management features
└─ Is a workspace like any other
```

### Database Structure

```sql
-- Organization example
INSERT INTO workspaces VALUES (
  'org_123',           -- id
  'organization',      -- type
  NULL,                -- parent_id (NULL for org)
  'user_456',          -- owner_id (the creator)
  'TechCorp Inc',      -- name
  'techcorp',          -- slug
  NOW()                -- created_at
);
```

### Typical Features in Organizations

**Common organization-level features:**
- Human Resources (HR)
- Billing & Invoicing
- Corporate Documents
- Organization Settings
- User Management
- Permissions Management (mandatory)

**But CAN have ANY feature:**
- Kanban
- Chat
- Calendar
- Time Tracking
- etc.

**IMPORTANT**: There are NO "organization-only" features. Any feature can be activated in any workspace type.

---

## Project (Child Workspace)

**Definition**: A project is a child workspace contained within an organization.

### Characteristics

```
Project
├─ Lives inside an organization (parent_id)
├─ Is a collaboration workspace
├─ Has its own active features
├─ Has its own members and roles
├─ Is completely independent from other projects
└─ Is a workspace like any other
```

### Database Structure

```sql
-- Project example
INSERT INTO workspaces VALUES (
  'proj_789',          -- id
  'project',           -- type
  'org_123',           -- parent_id (points to organization)
  NULL,                -- owner_id (NULL for projects - no project owner)
  'Marketing Campaign', -- name
  'marketing-campaign', -- slug
  NOW()                -- created_at
);
```

### Typical Features in Projects

**Common project-level features:**
- Kanban
- Gantt
- Task Management
- Chat
- Time Tracking
- Files
- Permissions Management (mandatory)

**But CAN have ANY feature:**
- HR (though unusual)
- Billing (though unusual)
- etc.

---

## Independence Between Workspaces

**FUNDAMENTAL RULE**: Workspaces are independent contexts.

### NO Feature Inheritance

```
Organization has: [HR, Billing, Kanban]
Project 1 has: [Kanban, Chat]
Project 2 has: [Gantt, Time Tracking]

Each workspace activates features EXPLICITLY.
Features DO NOT inherit automatically.
```

### Visual Example

```
Org "TechCorp"
Features: [HR ✓, Billing ✓, Kanban ✓, Chat ✗]

├─── Project "Marketing"
│    Features: [Kanban ✓, Chat ✓, HR ✗, Billing ✗]
│    └─ Has Kanban even though org also has it
│    └─ Has Chat even though org does NOT have it
│    └─ Does NOT have HR even though org has it
│
└─── Project "Development"
     Features: [Gantt ✓, Time Tracking ✓, Kanban ✗]
     └─ Completely different feature set
     └─ Does NOT have Kanban even though org has it
```

### Implications

- To use a feature in a workspace, it must be **EXPLICITLY activated** there
- A user working in a project **only sees features of that project**
- A user working in the org **only sees features of the org**
- They are **separate work spaces**

### NO Permission Inheritance

```
Juan is "Admin" in Organization
Juan is "Viewer" in Project 1
Juan has NO role in Project 2

Results:
├─ In Organization: Juan has Admin permissions
├─ In Project 1: Juan has Viewer permissions (NOT Admin)
└─ In Project 2: Juan has NO access (not a member)
```

**Exceptions to independence:**
- **Owner** of organization has automatic access to ALL projects
- **Super Admin** of organization has automatic access to ALL projects
- Normal users must be added explicitly to each workspace

---

## Workspace Rules

### RN-W01: Organization MUST have owner_id

```sql
CONSTRAINT org_has_owner CHECK (
  (type = 'organization' AND owner_id IS NOT NULL) OR
  (type = 'project')
)
```

### RN-W02: Organization CANNOT have parent_id

```sql
CONSTRAINT org_no_parent CHECK (
  (type = 'organization' AND parent_id IS NULL) OR
  (type = 'project' AND parent_id IS NOT NULL)
)
```

### RN-W03: Project MUST have parent_id

Projects must belong to an organization:

```sql
-- Valid
INSERT INTO workspaces (type, parent_id, name) VALUES
  ('project', 'org_123', 'My Project');

-- Invalid - will fail constraint
INSERT INTO workspaces (type, parent_id, name) VALUES
  ('project', NULL, 'My Project');
```

### RN-W04: Slug unique within container

Slugs must be unique within their container (org or parent org for projects):

```sql
UNIQUE(parent_id, slug)

-- Valid: Same slug in different orgs
Org A, slug: 'main' ✓
Org B, slug: 'main' ✓

-- Invalid: Same slug in same org
Org A, slug: 'main' ✓
Org A, slug: 'main' ✗ (duplicate)

-- Valid: Same slug in different projects
Org A → Project 1, slug: 'sprint-1' ✓
Org A → Project 2, slug: 'sprint-1' ✓

-- Invalid: Same slug in same org's projects
Org A → Project 1, slug: 'sprint-1' ✓
Org A → Project 2, slug: 'sprint-1' ✗ (duplicate within org A)
```

### RN-W05: Cascade delete

When an organization is deleted, all its projects are deleted:

```sql
parent_id UUID REFERENCES workspaces(id) ON DELETE CASCADE

-- If you delete the organization
DELETE FROM workspaces WHERE id = 'org_123';

-- All its projects are automatically deleted
-- Projects with parent_id = 'org_123' are removed
```

---

## Creating Workspaces

### Creating an Organization

```typescript
// 1. User creates organization
const org = await createWorkspace({
  type: 'organization',
  parent_id: null,
  owner_id: user_id,
  name: 'TechCorp Inc',
  slug: 'techcorp'
});

// 2. Feature "permissions-management" is auto-activated (trigger)
// INSERT INTO workspace_features (workspace_id, feature_id, enabled)
// VALUES (org.id, permissions_management_id, true)

// 3. User is now Owner
// - Has automatic total access
// - Does not need role assignment
```

### Creating a Project

```typescript
// 1. User creates project (must have permission or be Owner/Super Admin)
const project = await createWorkspace({
  type: 'project',
  parent_id: organization_id,
  name: 'Marketing Campaign',
  slug: 'marketing-campaign'
  // Note: NO owner_id (projects don't have owners)
});

// 2. Feature "permissions-management" is auto-activated (trigger)

// 3. Creator gets "Admin" role (normal role, NOT special)
// INSERT INTO user_workspace_roles (user_id, workspace_id, role_id)
// VALUES (creator_id, project.id, admin_role_id)

// 4. Creator can manage the project
// - BUT can be removed by Owner/Super Admin
// - Is NOT a "Project Owner" (concept doesn't exist)
```

---

## Workspace Context

**Definition**: Context = the workspace the user is currently working in.

### Context Switching

```typescript
// User navigates to organization
setActiveWorkspace(org_id);
// → Sees org features: [HR, Billing, Kanban]
// → Has org permissions: Admin

// User navigates to project
setActiveWorkspace(project_id);
// → Sees project features: [Kanban, Chat] (different from org)
// → Has project permissions: Viewer (different from org)

// User navigates to another project
setActiveWorkspace(project2_id);
// → May have NO access (not a member)
```

### Context Isolation

**CRITICAL**: All operations are contextual to the active workspace.

```typescript
// User in Project 1 context
canUserDoAction(user, 'create', 'boards', project1_id);
// → Checks:
//   1. Is feature "kanban" active in project1? ✓
//   2. Does user have "boards.create" in project1? ✓
//   → Result: true

// Same user, different context (Project 2)
canUserDoAction(user, 'create', 'boards', project2_id);
// → Checks:
//   1. Is feature "kanban" active in project2? ✗ (different features)
//   2. Does user have "boards.create" in project2? ✗ (not a member)
//   → Result: false
```

---

## Multi-Workspace Scenarios

### Scenario 1: User in Multiple Projects

```
User: Juan

Organization "TechCorp":
└─ Role: Employee
└─ Permissions: [profile.read, profile.update]

Project "Marketing":
└─ Role: Admin
└─ Permissions: [boards.*, cards.*, messages.*]

Project "Development":
└─ Role: Viewer
└─ Permissions: [*.read]
```

**Result**: Juan has **completely different permissions** in each workspace.

### Scenario 2: Owner Access

```
Organization "StartupXYZ":
└─ Owner: Ana

Project "Product" (under StartupXYZ):
└─ Members: [Pedro (Admin)]
└─ Ana is NOT explicitly a member

Result:
└─ Ana has AUTOMATIC access to "Product" (Owner bypass)
└─ Ana can do ANYTHING in "Product" (Owner privilege)
└─ Ana does NOT need to be added as member
```

### Scenario 3: Independent Features

```
Organization "AgencyCo":
└─ Features: [HR ✓, Billing ✓, Kanban ✓]

Project "Client Website" (under AgencyCo):
└─ Features: [Kanban ✓, Chat ✓, Files ✓]

Questions:
Q: Does "Client Website" inherit HR from org?
A: NO. Each workspace activates features explicitly.

Q: Can "Client Website" have Chat even if org doesn't?
A: YES. Features are independent per workspace.

Q: If user has "boards.create" in org, do they have it in project?
A: NO. Permissions are contextual to workspace.
```

---

## Summary

| Aspect | Organization | Project |
|--------|-------------|---------|
| **Type** | `'organization'` | `'project'` |
| **parent_id** | NULL (root) | Points to organization |
| **owner_id** | Required (creator) | NULL (no owner) |
| **Features** | Independent | Independent |
| **Permissions** | Contextual | Contextual |
| **Special Roles** | Owner, Super Admin | None (only normal roles) |
| **Deletion** | Cascades to projects | Independent |

**Key Takeaway**: Workspaces are **independent containers**. NO inheritance, NO sharing, EXPLICIT activation of everything.
