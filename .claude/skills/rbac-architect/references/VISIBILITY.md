# Visibility System

## Core Principle

**Users only see UI features for which they have permissions.**

```
If user has NO permission for a feature
→ Feature button/menu does NOT appear in UI
```

## Visibility Permission

Each feature needs a "visibility permission" - usually the `.read` permission.

### Example

```typescript
Feature: kanban

Permissions:
├─ boards.read      ← VISIBILITY permission
├─ boards.create
├─ boards.update
└─ boards.delete

If user has "boards.read" → Sees "Kanban" in menu
If NO "boards.read" → Does NOT see "Kanban" in menu
```

## Visibility Algorithm

```typescript
function shouldShowFeatureInMenu(user, feature, workspace): boolean {
  // 1. Owner and Super Admin see everything
  if (user.isOwner() || user.isSuperAdmin()) {
    return isFeatureActive(feature, workspace);
  }

  // 2. Check if feature is active
  if (!isFeatureActive(feature, workspace)) {
    return false;
  }

  // 3. Check if user has ANY permission from feature
  const featurePermissions = getFeaturePermissions(feature);
  const userPermissions = getUserPermissions(user, workspace);

  const hasAnyPermission = featurePermissions.some(
    perm => userPermissions.includes(perm)
  );

  return hasAnyPermission;
}
```

## Visibility by Role

### Owner and Super Admin

```
Owner/Super Admin:
└─ See ALL active features in workspace
└─ Regardless of specific permissions
└─ No need for visibility permissions
```

### Normal Users

```
Normal Users:
└─ Only see features where they have AT LEAST one permission
└─ If have "boards.read" → See Kanban
└─ If NO kanban permissions → Do NOT see Kanban
└─ Even if feature is active in workspace
```

## Implementation Examples

### React Hook

```typescript
function useFeatureVisibility(featureSlug: string) {
  const { user, workspace } = useContext();
  const { ability } = usePermissions();

  // Owner/Super Admin see everything
  if (user.isOwner || user.isSuperAdmin) {
    return isFeatureActive(featureSlug, workspace);
  }

  // Check if has any permission from feature
  const feature = getFeature(featureSlug);
  const hasPermission = feature.permissions.some(
    perm => ability.can(perm.action, perm.resource)
  );

  return hasPermission;
}
```

### Navigation Menu Component

```tsx
function NavigationMenu() {
  const showKanban = useFeatureVisibility('kanban');
  const showChat = useFeatureVisibility('chat');
  const showHR = useFeatureVisibility('hr');
  const showPermissions = useFeatureVisibility('permissions-management');

  return (
    <nav>
      {showKanban && <MenuItem to="/kanban">Kanban</MenuItem>}
      {showChat && <MenuItem to="/chat">Chat</MenuItem>}
      {showHR && <MenuItem to="/hr">HR</MenuItem>}
      {showPermissions && <MenuItem to="/permissions">Permissions</MenuItem>}
    </nav>
  );
}
```

### Feature Gate Component

```tsx
interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
}

function FeatureGate({ feature, children }: FeatureGateProps) {
  const isVisible = useFeatureVisibility(feature);

  if (!isVisible) return null;

  return <>{children}</>;
}

// Usage
<FeatureGate feature="kanban">
  <KanbanBoard />
</FeatureGate>
```

## Granular Visibility (Within Features)

Once inside a feature, visibility applies to **individual actions**:

```tsx
function KanbanBoard() {
  const { ability } = usePermissions();

  return (
    <div>
      <h1>Kanban Boards</h1>

      {/* Only show if has permission */}
      <Can I="create" a="boards" ability={ability}>
        <CreateBoardButton />
      </Can>

      <BoardList>
        {boards.map(board => (
          <Board key={board.id} data={board}>
            {/* Only show if has permission */}
            <Can I="update" a="boards" ability={ability}>
              <EditButton />
            </Can>

            <Can I="delete" a="boards" ability={ability}>
              <DeleteButton />
            </Can>
          </Board>
        ))}
      </BoardList>
    </div>
  );
}
```

## Visibility Example Scenario

```typescript
Workspace: Project "Development Team"
Active features: [Kanban, Chat, Time Tracking, Files, permissions-management]

User Ana (Admin):
├─ Permissions: *.* (all)
└─ Sees: All 5 features ✓

User Pedro (Developer):
├─ Permissions: [boards.*, cards.*, messages.send, time_entries.*]
└─ Sees: Kanban ✓, Chat ✓, Time Tracking ✓
└─ Does NOT see: Files ✗, Permissions ✗

User Laura (Viewer):
├─ Permissions: [boards.read, cards.read, messages.read]
└─ Sees: Kanban ✓, Chat ✓
└─ Does NOT see: Time Tracking ✗, Files ✗, Permissions ✗
```

### Within Kanban (Laura's View)

```
Laura sees:
├─ Boards list ✓ (has boards.read)
├─ Cards list ✓ (has cards.read)
├─ Create Board button ✗ (no boards.create)
├─ Edit button ✗ (no boards.update)
└─ Delete button ✗ (no boards.delete)

Result: Read-only view
```

## Database Query for Visible Features

```sql
-- Get features visible to user in workspace
WITH user_permissions AS (
  SELECT p.full_name, p.feature_id
  FROM permissions p
  JOIN role_permissions rp ON rp.permission_id = p.id
  JOIN user_workspace_roles uwr ON uwr.role_id = rp.role_id
  WHERE uwr.user_id = :user_id
    AND uwr.workspace_id = :workspace_id
)
SELECT DISTINCT f.slug, f.name
FROM features f
JOIN workspace_features wf ON wf.feature_id = f.id
WHERE wf.workspace_id = :workspace_id
  AND wf.enabled = true
  AND (
    -- Owner/Super Admin bypass
    :is_owner OR :is_super_admin
    OR
    -- Has at least one permission from feature
    f.id IN (SELECT feature_id FROM user_permissions)
  );
```

## Summary

| Role | Visibility Rule |
|------|----------------|
| **Owner** | All active features |
| **Super Admin** | All active features |
| **Normal User** | Only features with at least one permission |

**Key Takeaway**: Visibility is **permission-based**. NO permissions = NO visibility.
