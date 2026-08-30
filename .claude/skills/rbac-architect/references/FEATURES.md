# Feature System

## Table of Contents
- [Global Feature Catalog](#global-feature-catalog)
- [Feature Activation](#feature-activation)
- [Feature Resources and Permissions](#feature-resources-and-permissions)
- [Feature Independence](#feature-independence)
- [Mandatory Feature: permissions-management](#mandatory-feature-permissions-management)

---

## Global Feature Catalog

**Definition**: There exists a global catalog that lists all available features in the system.

### Database Table: `features`

```sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Characteristics

- **Global**: Exists once in the system
- **Catalog**: Lists all possible features
- **Not workspace-specific**: Available for activation in any workspace
- **The "menu"**: Think of it as the menu of available features

### Example Catalog

```sql
INSERT INTO features (slug, name, category, is_mandatory) VALUES
  ('kanban', 'Kanban Board', 'productivity', false),
  ('gantt', 'Gantt Charts', 'productivity', false),
  ('chat', 'Team Chat', 'communication', false),
  ('hr', 'Human Resources', 'management', false),
  ('billing', 'Billing & Invoicing', 'finance', false),
  ('time-tracking', 'Time Tracking', 'productivity', false),
  ('permissions-management', 'Permissions Management', 'system', true),
  ('documents', 'Document Management', 'productivity', false),
  ('calendar', 'Calendar', 'productivity', false),
  ('analytics', 'Analytics', 'insights', false);
```

### Feature Categories

Common categories:
- `productivity`: Task management, calendars, time tracking
- `communication`: Chat, video, messaging
- `management`: HR, project management, resource planning
- `finance`: Billing, invoicing, expenses
- `insights`: Analytics, reporting, dashboards
- `system`: Core system features (permissions, settings)

---

## Feature Activation

**Definition**: A feature is activated in a specific workspace through an explicit relationship.

### Database Table: `workspace_features`

```sql
CREATE TABLE workspace_features (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_by UUID REFERENCES auth.users(id),

  PRIMARY KEY (workspace_id, feature_id)
);

-- Indexes
CREATE INDEX idx_workspace_features_workspace ON workspace_features(workspace_id);
CREATE INDEX idx_workspace_features_feature ON workspace_features(feature_id);
CREATE INDEX idx_workspace_features_enabled ON workspace_features(workspace_id, enabled);
```

### Activation Rules

**RN-F03**: A feature is only available in a workspace if:
```sql
SELECT enabled
FROM workspace_features
WHERE workspace_id = :workspace_id
  AND feature_id = :feature_id
  AND enabled = true
```

If the record doesn't exist or `enabled = false`, the feature is **NOT available**.

### Activation Examples

```sql
-- Org has Kanban and HR
INSERT INTO workspace_features (workspace_id, feature_id, enabled) VALUES
  ('org_1', 'kanban_id', true),
  ('org_1', 'hr_id', true);

-- Project 1 has Kanban and Chat
INSERT INTO workspace_features (workspace_id, feature_id, enabled) VALUES
  ('proj_1', 'kanban_id', true),
  ('proj_1', 'chat_id', true);

-- Project 2 only has Gantt
INSERT INTO workspace_features (workspace_id, feature_id, enabled) VALUES
  ('proj_2', 'gantt_id', true);
```

### Feature Configuration

The `config` JSONB field allows workspace-specific feature configuration:

```typescript
// Example: Kanban feature config per workspace
{
  "default_columns": ["To Do", "In Progress", "Done"],
  "allow_custom_columns": true,
  "max_cards_per_column": 50,
  "enable_swimlanes": false
}

// Example: Chat feature config
{
  "max_message_length": 2000,
  "allow_file_attachments": true,
  "max_file_size_mb": 10,
  "enable_threading": true
}
```

Usage:

```sql
INSERT INTO workspace_features (workspace_id, feature_id, enabled, config) VALUES
  ('proj_1', 'kanban_id', true, '{"default_columns": ["Backlog", "Sprint", "Done"]}');
```

---

## Feature Resources and Permissions

**Definition**: Each feature defines the resources it operates on and the permissions available.

### Database Table: `feature_resources`

```sql
CREATE TABLE feature_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  description TEXT,

  UNIQUE(feature_id, resource)
);

CREATE INDEX idx_feature_resources_feature ON feature_resources(feature_id);
```

### Database Table: `feature_permissions`

```sql
CREATE TABLE feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,

  UNIQUE(feature_id, resource, action)
);

CREATE INDEX idx_feature_permissions_feature ON feature_permissions(feature_id);
```

### Example: Kanban Feature

```sql
-- Feature
INSERT INTO features (slug, name, category) VALUES
  ('kanban', 'Kanban Board', 'productivity');

-- Resources
INSERT INTO feature_resources (feature_id, resource, description) VALUES
  ('kanban_id', 'boards', 'Kanban boards'),
  ('kanban_id', 'columns', 'Board columns'),
  ('kanban_id', 'cards', 'Kanban cards'),
  ('kanban_id', 'card_comments', 'Comments on cards');

-- Permissions
INSERT INTO feature_permissions (feature_id, resource, action, description) VALUES
  ('kanban_id', 'boards', 'create', 'Create new boards'),
  ('kanban_id', 'boards', 'read', 'View boards'),
  ('kanban_id', 'boards', 'update', 'Edit boards'),
  ('kanban_id', 'boards', 'delete', 'Delete boards'),
  ('kanban_id', 'columns', 'create', 'Create columns'),
  ('kanban_id', 'columns', 'reorder', 'Reorder columns'),
  ('kanban_id', 'cards', 'create', 'Create cards'),
  ('kanban_id', 'cards', 'read', 'View cards'),
  ('kanban_id', 'cards', 'update', 'Edit cards'),
  ('kanban_id', 'cards', 'delete', 'Delete cards'),
  ('kanban_id', 'cards', 'move', 'Move cards between columns'),
  ('kanban_id', 'cards', 'assign', 'Assign cards to users'),
  ('kanban_id', 'card_comments', 'create', 'Create comments'),
  ('kanban_id', 'card_comments', 'delete', 'Delete comments');
```

### Feature Structure Diagram

```
Feature: kanban

Resources:
├─ boards
├─ columns
├─ cards
└─ card_comments

Permissions:
├─ boards.create
├─ boards.read
├─ boards.update
├─ boards.delete
├─ columns.create
├─ columns.reorder
├─ cards.create
├─ cards.read
├─ cards.update
├─ cards.delete
├─ cards.move
├─ cards.assign
└─ card_comments.create
```

---

## Feature Independence

**FUNDAMENTAL RULE**: Features DO NOT inherit or share between workspaces.

### RN-F04: NO Inheritance

```
Organization has: [HR, Billing, Kanban]
Project has: [Kanban, Chat]

Results:
├─ Project does NOT inherit HR from organization
├─ Project does NOT inherit Billing from organization
├─ Project HAS Kanban independently (separate activation)
└─ Each activation is EXPLICIT
```

### Verification Example

```typescript
// Check if feature is active in workspace
async function isFeatureActive(
  featureSlug: string,
  workspaceId: string
): Promise<boolean> {
  const result = await db.query(`
    SELECT enabled
    FROM workspace_features wf
    JOIN features f ON f.id = wf.feature_id
    WHERE wf.workspace_id = $1
      AND f.slug = $2
  `, [workspaceId, featureSlug]);

  return result.rows[0]?.enabled === true;
}

// WRONG: Searching in parent workspace
async function isFeatureActiveWRONG(
  featureSlug: string,
  workspaceId: string
): Promise<boolean> {
  // ❌ DO NOT check parent workspace
  // ❌ DO NOT assume inheritance
  const workspace = await getWorkspace(workspaceId);

  // ❌ WRONG
  if (workspace.parent_id) {
    return isFeatureActive(featureSlug, workspace.parent_id);
  }
}
```

### RN-F05: Any Feature in Any Workspace

```sql
-- Valid: HR in organization (typical)
INSERT INTO workspace_features VALUES ('org_1', 'hr_id', true);

-- Valid: HR in project (unusual but allowed)
INSERT INTO workspace_features VALUES ('proj_1', 'hr_id', true);

-- Valid: Kanban in organization (unusual but allowed)
INSERT INTO workspace_features VALUES ('org_1', 'kanban_id', true);

-- Valid: Kanban in project (typical)
INSERT INTO workspace_features VALUES ('proj_1', 'kanban_id', true);
```

**NO restrictions** on which features can be activated in which workspace types.

---

## Mandatory Feature: permissions-management

**Definition**: The `permissions-management` feature is **required** in all workspaces.

### Database Record

```sql
INSERT INTO features (slug, name, category, is_mandatory) VALUES
  ('permissions-management', 'Permissions Management', 'system', true);
```

### Auto-Activation

**RN-F01**: This feature activates **automatically** when creating a workspace.

```sql
-- Trigger function
CREATE FUNCTION auto_enable_permissions_management()
RETURNS TRIGGER AS $$
DECLARE
  v_feature_id UUID;
BEGIN
  -- Get permissions-management feature ID
  SELECT id INTO v_feature_id
  FROM features
  WHERE slug = 'permissions-management';

  -- Auto-activate
  INSERT INTO workspace_features (workspace_id, feature_id, enabled, enabled_by)
  VALUES (NEW.id, v_feature_id, TRUE, NEW.owner_id)
  ON CONFLICT (workspace_id, feature_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_auto_enable_permissions_management
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE FUNCTION auto_enable_permissions_management();
```

### Cannot Be Disabled

**RN-F02**: Mandatory features cannot be disabled.

```sql
-- Trigger to prevent disabling
CREATE FUNCTION prevent_remove_mandatory_features()
RETURNS TRIGGER AS $$
DECLARE
  v_is_mandatory BOOLEAN;
BEGIN
  SELECT is_mandatory INTO v_is_mandatory
  FROM features
  WHERE id = NEW.feature_id;

  IF v_is_mandatory AND NEW.enabled = FALSE THEN
    RAISE EXCEPTION 'Cannot disable mandatory feature';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_remove_mandatory_features
BEFORE UPDATE ON workspace_features
FOR EACH ROW
EXECUTE FUNCTION prevent_remove_mandatory_features();
```

### Permissions-Management Resources

```sql
-- Resources (org level)
INSERT INTO feature_resources (feature_id, resource) VALUES
  ('pm_id', 'members'),
  ('pm_id', 'roles'),
  ('pm_id', 'permissions'),
  ('pm_id', 'projects');  -- Only in organization

-- Resources (project level)
-- Same as org but WITHOUT 'projects'
```

### Permissions-Management Permissions

```sql
INSERT INTO feature_permissions (feature_id, resource, action) VALUES
  ('pm_id', 'members', 'view'),
  ('pm_id', 'members', 'invite'),
  ('pm_id', 'members', 'remove'),
  ('pm_id', 'members', 'assign_roles'),
  ('pm_id', 'members', 'remove_roles'),
  ('pm_id', 'roles', 'view'),
  ('pm_id', 'roles', 'create'),
  ('pm_id', 'roles', 'edit'),
  ('pm_id', 'roles', 'delete'),
  ('pm_id', 'permissions', 'view'),
  ('pm_id', 'permissions', 'assign'),
  ('pm_id', 'permissions', 'revoke'),
  ('pm_id', 'projects', 'manage');  -- Only in organization
```

---

## Adding New Features to Catalog

### Step 1: Define Feature

```sql
INSERT INTO features (slug, name, description, category, is_mandatory) VALUES
  ('time-tracking', 'Time Tracking', 'Track time spent on tasks', 'productivity', false);
```

### Step 2: Define Resources

```sql
INSERT INTO feature_resources (feature_id, resource, description) VALUES
  ('time_tracking_id', 'time_entries', 'Individual time entries'),
  ('time_tracking_id', 'timesheets', 'Aggregated timesheets');
```

### Step 3: Define Permissions

```sql
INSERT INTO feature_permissions (feature_id, resource, action, description) VALUES
  ('time_tracking_id', 'time_entries', 'create', 'Start time tracking'),
  ('time_tracking_id', 'time_entries', 'read', 'View time entries'),
  ('time_tracking_id', 'time_entries', 'update', 'Edit time entries'),
  ('time_tracking_id', 'time_entries', 'delete', 'Delete time entries'),
  ('time_tracking_id', 'timesheets', 'read', 'View timesheets'),
  ('time_tracking_id', 'timesheets', 'export', 'Export timesheets');
```

### Step 4: Available for Activation

Feature is now available for activation in any workspace:

```sql
INSERT INTO workspace_features (workspace_id, feature_id, enabled) VALUES
  ('workspace_id', 'time_tracking_id', true);
```

---

## Feature Querying Patterns

### Get Active Features in Workspace

```sql
SELECT f.slug, f.name, f.category
FROM features f
JOIN workspace_features wf ON wf.feature_id = f.id
WHERE wf.workspace_id = :workspace_id
  AND wf.enabled = true;
```

### Get Feature Permissions

```sql
SELECT fp.resource, fp.action, fp.resource || '.' || fp.action AS full_name
FROM feature_permissions fp
JOIN features f ON f.id = fp.feature_id
WHERE f.slug = :feature_slug;
```

### Check Feature Availability

```sql
-- Function
CREATE FUNCTION is_feature_active(p_feature_slug TEXT, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(wf.enabled, FALSE)
  FROM workspace_features wf
  JOIN features f ON f.id = wf.feature_id
  WHERE wf.workspace_id = p_workspace_id
    AND f.slug = p_feature_slug;
$$ LANGUAGE sql STABLE;

-- Usage
SELECT is_feature_active('kanban', 'workspace_123');
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Catalog** | Global `features` table |
| **Activation** | Explicit via `workspace_features` |
| **Independence** | NO inheritance between workspaces |
| **Flexibility** | Any feature in any workspace type |
| **Mandatory** | `permissions-management` always active |
| **Configuration** | Workspace-specific JSONB config |

**Key Takeaway**: Features are **modular, independent, and explicitly activated** per workspace. NO assumptions, NO inheritance, EXPLICIT everything.
