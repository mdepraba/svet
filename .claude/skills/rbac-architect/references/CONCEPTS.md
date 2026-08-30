# Core Concepts

## Table of Contents
- [Workspace](#workspace)
- [Feature](#feature)
- [Resource](#resource)
- [Permission](#permission)
- [Role](#role)

---

## Workspace

**Definition**: A workspace is a container of work representing a space where users can work and collaborate.

### Types of Workspace

**Organization (Organización)**
- Workspace raíz, contenedor padre
- `parent_id` is NULL
- Has an `owner_id` (the creator)
- Can contain multiple projects

**Project (Proyecto)**
- Workspace hijo, contenido dentro de una organización
- `parent_id` points to organization
- NO owner_id (Owner concept only exists at org level)
- Lives within one organization

### Properties

```typescript
workspace {
  id: UUID
  type: 'organization' | 'project'
  parent_id: UUID | NULL  // NULL if org, org_id if project
  name: string
  slug: string
  owner_id: UUID | NULL   // Only for organizations
  created_at: timestamp
}
```

### Key Characteristics

- Each workspace has its **own active features**
- Each workspace has its **own members with roles**
- Workspaces are **independent contexts** (no inheritance)
- An organization can contain **multiple projects**

### Hierarchy Example

```
ORGANIZACIÓN "TechCorp"
├─ parent_id: NULL
├─ owner_id: user_123
├─ Features: [HR, Billing, Kanban]
│
├─── PROYECTO "Marketing"
│    ├─ parent_id: techcorp_id
│    ├─ owner_id: NULL (no owner for projects)
│    └─ Features: [Kanban, Chat] (independent from org)
│
└─── PROYECTO "Development"
     ├─ parent_id: techcorp_id
     └─ Features: [Gantt, Time Tracking] (different from Marketing)
```

---

## Feature

**Definition**: A feature is a self-contained functional module that provides specific capabilities to the workspace where it is activated.

### Structure

```typescript
feature {
  id: UUID
  slug: string  // e.g., 'kanban', 'hr', 'chat'
  name: string  // e.g., 'Kanban Board'
  description: string
  category: string  // e.g., 'productivity', 'management'
  is_mandatory: boolean
}
```

### Examples of Features

- `kanban`: Kanban Boards
- `gantt`: Gantt Charts
- `chat`: Team Chat
- `time-tracking`: Time Tracking
- `hr`: Human Resources Management
- `billing`: Billing & Invoicing
- `analytics`: Analytics
- `documents`: Document Management
- `calendar`: Calendar
- `permissions-management`: Permissions Management (mandatory)

### Characteristics

- A feature can be activated/deactivated in **any workspace**
- **No restrictions** on "org-only" or "project-only" features
- Each feature defines its **own resources and permissions**
- Features are **completely modular and decoupled**

### Feature Independence

**CRITICAL RULE**: Features DO NOT inherit between workspaces.

```
Organization has: [HR, Billing, Kanban]
Project 1 has: [Kanban, Chat]
Project 2 has: [Gantt, Time Tracking]

Each workspace activates features EXPLICITLY.
NO automatic inheritance.
```

---

## Resource

**Definition**: A resource is an entity on which operations can be performed within a feature.

### Example

```
Feature: kanban
├─ Resource: boards
├─ Resource: columns
├─ Resource: cards
└─ Resource: card_comments
```

### Resource Properties

```typescript
feature_resource {
  id: UUID
  feature_id: UUID  // Which feature owns this resource
  resource: string  // e.g., 'boards', 'cards'
  description: text
}
```

### Characteristics

- Resources are **specific to features**
- Multiple features can have resources with same name (e.g., `comments`)
- Resources define **what** users interact with
- Permissions define **how** users interact with resources

---

## Permission

**Definition**: A permission is the ability to perform a specific action on a resource.

### Format

`{resource}.{action}`

### Examples

```
boards.create    // Create boards
boards.read      // View boards
boards.update    // Edit boards
boards.delete    // Delete boards
cards.move       // Move cards
cards.assign     // Assign cards
```

### Permission Structure

```typescript
feature_permission {
  id: UUID
  feature_id: UUID
  resource: string
  action: string  // 'create', 'read', 'update', 'delete', custom
  description: text
}

// Materialized view
permission {
  id: UUID
  feature_id: UUID
  resource: string
  action: string
  full_name: string  // "{resource}.{action}"
}
```

### Characteristics

- Permissions are **granular** (specific operation on specific resource)
- Permissions **belong to features**
- Permissions are **contextual** (only apply where feature is active)

### Permission Scope

Permissions **only apply** in workspaces where:
1. The feature is **activated** (`workspace_features.enabled = true`)
2. The user has a **role** that includes that permission
3. The user is working **in that specific workspace context**

### Standard CRUD Actions

- `create`: Create new instances
- `read`: View/list instances
- `update`: Modify existing instances
- `delete`: Remove instances

### Custom Actions

Beyond CRUD, features can define custom actions:
- `cards.move`: Move cards between columns
- `cards.assign`: Assign cards to users
- `columns.reorder`: Reorder columns
- `time_entries.start`: Start time tracking
- `invoices.send`: Send invoices to clients

---

## Role

**Definition**: A role is a collection of permissions assigned to users in a specific workspace.

### Types of Roles

#### A. Normal Roles

**Definition**: Normal roles are simply **sets of permissions** with no special logic.

```
Normal Roles = Collections of Permissions
├─ Admin
├─ Editor
├─ Viewer
├─ Developer
├─ Manager
└─ (Any custom role)

Characteristics:
- Groupings of permissions
- Assigned in a specific workspace
- Contextual (not inherited)
```

#### B. Special Roles

**Definition**: Owner and Super Admin are **NOT permission sets** - they have special system logic.

```
Special Roles
├─ Owner
│  ├─ NOT a permission set
│  ├─ Defined by workspaces.owner_id
│  ├─ Only at organization level
│  └─ Bypasses all permission checks
│
└─ Super Admin
   ├─ NOT a permission set
   ├─ Defined in organization_super_admins table
   ├─ Only at organization level
   ├─ Bypasses normal permission checks
   └─ Has restrictions (cannot modify Owner/other Super Admins)
```

### Role Structure

```typescript
role {
  id: UUID
  name: string
  slug: string
  description: text
  is_special: boolean  // false for normal roles
  scope: 'organization' | 'project'
}

role_permission {
  role_id: UUID
  permission_id: UUID
}

user_workspace_role {
  id: UUID
  user_id: UUID
  workspace_id: UUID
  role_id: UUID
  assigned_by: UUID
  assigned_at: timestamp
}
```

### Role Scope

**Normal Roles:**
- Only apply in the **workspace where assigned**
- NO inheritance between workspaces
- User can have **different roles** in different workspaces

**Special Roles:**
- Owner and Super Admin only exist at **organization level**
- NO "Owner of project" or "Super Admin of project"
- Owner/Super Admin have **automatic access** to all projects in their org

### Role Assignment

```typescript
// María es Editor en Org
user_workspace_role {
  user_id: maria_id,
  workspace_id: org_1,
  role_id: role_editor
}

// María es Admin en Proyecto 1
user_workspace_role {
  user_id: maria_id,
  workspace_id: proj_1,
  role_id: role_admin
}

// María es Viewer en Proyecto 2
user_workspace_role {
  user_id: maria_id,
  workspace_id: proj_2,
  role_id: role_viewer
}

Result:
- María has DIFFERENT permissions in each context
- Roles are INDEPENDENT
```

### Effective Permissions

When a user has **multiple roles** in the same workspace, their effective permissions are the **UNION** of all permissions from all roles.

```typescript
User has roles: [Editor, Developer]

Editor permissions: [boards.create, boards.read, cards.create]
Developer permissions: [cards.update, cards.delete, time_entries.create]

Effective permissions: UNION of both
= [boards.create, boards.read, cards.create, cards.update, cards.delete, time_entries.create]
```

---

## Summary

| Concept | Definition | Key Property |
|---------|-----------|--------------|
| **Workspace** | Container for work | Independent contexts (org/project) |
| **Feature** | Functional module | Activatable, modular, no inheritance |
| **Resource** | Entity to interact with | Belongs to feature |
| **Permission** | Ability to act on resource | Format: `resource.action` |
| **Role** | Collection of permissions | Normal (sets) vs Special (bypass logic) |

## Key Relationships

```
Workspace
  ├─ has_many Features (via workspace_features)
  ├─ has_many Users (via user_workspace_roles)
  └─ has_one Owner (only for organizations)

Feature
  ├─ has_many Resources (via feature_resources)
  └─ has_many Permissions (via feature_permissions)

Role
  ├─ has_many Permissions (via role_permissions)
  └─ assigned_to Users in Workspaces (via user_workspace_roles)

Permission
  ├─ belongs_to Feature
  └─ targets Resource (within that feature)
```
