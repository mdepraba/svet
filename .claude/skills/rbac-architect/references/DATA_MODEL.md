# Database Schema Patterns

## Core Tables

### workspaces
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('organization', 'project')),
  parent_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT org_no_parent CHECK (
    (type = 'organization' AND parent_id IS NULL) OR
    (type = 'project' AND parent_id IS NOT NULL)
  ),
  CONSTRAINT org_has_owner CHECK (
    (type = 'organization' AND owner_id IS NOT NULL) OR
    (type = 'project')
  ),
  UNIQUE(parent_id, slug)
);

CREATE INDEX idx_workspaces_parent ON workspaces(parent_id);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
```

### features
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

### workspace_features
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
```

### feature_permissions
```sql
CREATE TABLE feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,

  UNIQUE(feature_id, resource, action)
);
```

### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_special BOOLEAN DEFAULT FALSE,
  scope VARCHAR(20) CHECK (scope IN ('organization', 'project')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slug, scope)
);
```

### role_permissions
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES feature_permissions(id) ON DELETE CASCADE,

  PRIMARY KEY (role_id, permission_id)
);
```

### user_workspace_roles
```sql
CREATE TABLE user_workspace_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, workspace_id, role_id)
);

CREATE INDEX idx_user_workspace_roles_user_workspace
ON user_workspace_roles(user_id, workspace_id);
```

### organization_super_admins
```sql
CREATE TABLE organization_super_admins (
  organization_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (organization_id, user_id),

  CONSTRAINT super_admin_only_in_org CHECK (
    organization_id IN (SELECT id FROM workspaces WHERE type = 'organization')
  )
);
```

## RLS Policy Patterns

### Pattern: Owner/Super Admin Bypass

```sql
CREATE POLICY "policy_name"
ON table_name FOR SELECT
TO authenticated
USING (
  -- Owner bypass
  workspace_id IN (
    SELECT id FROM workspaces
    WHERE owner_id = auth.uid()
  )
  OR
  -- Super Admin bypass
  workspace_id IN (
    SELECT organization_id FROM organization_super_admins
    WHERE user_id = auth.uid()
  )
  OR
  -- Normal user with permission
  user_can(auth.uid(), 'action', 'resource', workspace_id)
);
```

### Pattern: Workspace Member Access

```sql
CREATE POLICY "Users access their workspace data"
ON table_name FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM user_workspace_roles
    WHERE user_id = auth.uid()
  )
);
```

## Feature Table Pattern

**All feature tables MUST include `workspace_id`:**

```sql
CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for feature table
CREATE POLICY "Users can access boards in their workspaces"
ON kanban_boards FOR SELECT
TO authenticated
USING (
  -- Owner/Super Admin bypass
  workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  )
  OR workspace_id IN (
    SELECT organization_id FROM organization_super_admins WHERE user_id = auth.uid()
  )
  OR
  -- Permission check
  user_can(auth.uid(), 'read', 'boards', workspace_id)
);
```

## Key Database Functions

```sql
-- Get organization from workspace
CREATE FUNCTION get_user_organization(p_workspace_id UUID)
RETURNS UUID AS $$
  SELECT COALESCE(parent_id, id) FROM workspaces WHERE id = p_workspace_id;
$$ LANGUAGE sql STABLE;

-- Check if user is owner
CREATE FUNCTION is_user_owner(p_user_id UUID, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT owner_id = p_user_id
  FROM workspaces
  WHERE id = get_user_organization(p_workspace_id) AND type = 'organization';
$$ LANGUAGE sql STABLE;

-- Check if user is super admin
CREATE FUNCTION is_user_super_admin(p_user_id UUID, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_super_admins
    WHERE organization_id = get_user_organization(p_workspace_id)
      AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE;

-- Check if feature is active
CREATE FUNCTION is_feature_active(p_feature_slug TEXT, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(wf.enabled, FALSE)
  FROM workspace_features wf
  JOIN features f ON f.id = wf.feature_id
  WHERE wf.workspace_id = p_workspace_id AND f.slug = p_feature_slug;
$$ LANGUAGE sql STABLE;
```

## Migration Pattern for New Feature

```sql
-- 1. Insert feature
INSERT INTO features (slug, name, category) VALUES
  ('time-tracking', 'Time Tracking', 'productivity');

-- 2. Define resources
INSERT INTO feature_resources (feature_id, resource) VALUES
  ('time_tracking_id', 'time_entries'),
  ('time_tracking_id', 'timesheets');

-- 3. Define permissions
INSERT INTO feature_permissions (feature_id, resource, action) VALUES
  ('time_tracking_id', 'time_entries', 'create'),
  ('time_tracking_id', 'time_entries', 'read'),
  ('time_tracking_id', 'time_entries', 'update'),
  ('time_tracking_id', 'time_entries', 'delete');

-- 4. Create feature tables
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT
);

-- 5. Create RLS policies
CREATE POLICY "time_entries_select" ON time_entries FOR SELECT
TO authenticated
USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  OR workspace_id IN (SELECT organization_id FROM organization_super_admins WHERE user_id = auth.uid())
  OR user_can(auth.uid(), 'read', 'time_entries', workspace_id)
);
```
