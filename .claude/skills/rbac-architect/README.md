# RBAC Permissions Architect Skill

## Purpose

This skill enables the Architect Agent to design features that correctly integrate with the project's RBAC modular permissions system defined in `concepto-base.md`.

## Structure

```
rbac-permissions-architect/
├── SKILL.md                    # Main skill guide with architect workflow
└── references/                 # Domain-specific reference files
    ├── CONCEPTS.md             # Core definitions (Workspace, Feature, Resource, Permission, Role)
    ├── WORKSPACES.md           # Organization vs Project architecture, independence
    ├── FEATURES.md             # Feature catalog, activation, configuration
    ├── PERMISSIONS.md          # Permission system, verification, contextual rules
    ├── SPECIAL_ROLES.md        # Owner and Super Admin privileges and restrictions
    ├── VISIBILITY.md           # UI visibility system based on permissions
    ├── DATA_MODEL.md           # Database schema, RLS policies, functions
    └── BUSINESS_RULES.md       # Quick reference of all RN-* rules
```

## Usage

The Architect Agent should invoke this skill when:
- Creating PRDs for features that involve permissions or access control
- Designing features within workspaces (organizations or projects)
- Defining resources and permissions for new feature modules
- Architecting features that interact with Owner/Super Admin roles

## Key Concepts

### The Three Pillars
1. **Workspaces**: Independent containers (Organizations and Projects)
2. **Features**: Modular, activatable functionality
3. **RBAC**: Granular permission-based access control

### Critical Rules
- **NO inheritance**: Features and permissions don't inherit between workspaces
- **Contextual permissions**: Only apply in specific workspace
- **Special roles**: Owner and Super Admin bypass normal permission checks
- **Mandatory feature**: `permissions-management` always active
- **Independence**: Each workspace explicitly activates everything

## Reference Files

Load reference files as needed during the architecture phase:

- **CONCEPTS.md**: Start here for definitions of core concepts
- **WORKSPACES.md**: Understand organization/project independence
- **FEATURES.md**: Learn how features activate and operate
- **PERMISSIONS.md**: Deep dive into permission verification
- **SPECIAL_ROLES.md**: Understand Owner/Super Admin powers and limits
- **VISIBILITY.md**: Design UI visibility based on permissions
- **DATA_MODEL.md**: Database schema patterns and RLS policies
- **BUSINESS_RULES.md**: Quick lookup of all business rules

## Workflow Summary

1. **Feature Scope Definition** → Consult CONCEPTS.md, WORKSPACES.md
2. **Permission Matrix Design** → Consult PERMISSIONS.md
3. **Special Roles Integration** → Consult SPECIAL_ROLES.md
4. **Feature Activation Strategy** → Consult FEATURES.md
5. **Visibility Rules** → Consult VISIBILITY.md
6. **Database Schema** → Consult DATA_MODEL.md
7. **PRD Documentation** → Use all references + BUSINESS_RULES.md

## Example PRD Output

When using this skill, the Architect should produce PRDs with:

- Feature metadata (slug, category, workspace scope)
- Complete permission matrix (`resource.action` format)
- Role definitions (if applicable)
- Special role behavior (Owner/Super Admin)
- Workspace integration details
- Data contracts (Zod schemas in entities.ts)
- Database schema with RLS policies

## Integration with Project Workflow

This skill is specifically designed for the **Architect Agent** in the TDD workflow:

```
1. Architect (uses this skill) → PRD with RBAC-aware design
2. Test Agent → Tests for permissions, features, roles
3. Implementer Agent → Use cases with permission checks
4. Supabase Agent → RLS policies, permission functions
5. UI/UX Expert → Visibility-based UI components
```

## Notes

- This skill complements the `architect-deep-analysis` skill
- Can be used alongside that skill for comprehensive architecture
- Reference files use progressive disclosure to minimize token usage
- All information sourced from authoritative `concepto-base.md` (2833 lines)
