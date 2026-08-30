# UI/UX Expert Skill Assets

Templates, examples, and visual aids for UI implementation.

---

## Directory Structure

```
assets/
├── component-templates/         # Reusable component patterns
│   ├── page-template.tsx       # Page component structure
│   ├── form-template.tsx       # Form with React Hook Form + Zod
│   ├── list-template.tsx       # Data list with TanStack Query
│   ├── modal-template.tsx      # Dialog/Modal pattern
│   └── card-template.tsx       # Card component pattern
├── form-examples/               # Form patterns
│   ├── simple-form.tsx         # Basic form
│   ├── multi-step-form.tsx     # Wizard pattern
│   ├── conditional-fields.tsx  # Dynamic form fields
│   └── optimistic-update.tsx   # Optimistic UI pattern
├── layout-patterns/             # Layout examples
│   ├── dashboard-layout.tsx    # Dashboard structure
│   ├── settings-layout.tsx     # Settings page pattern
│   └── list-detail.tsx         # Master-detail pattern
└── README.md                    # This file
```

---

## Component Templates

### 1. **page-template.tsx** - Page Component Structure
**When to use**: Starting a new page route
**Pattern**: Client Component with TanStack Query for data fetching
**Features**:
- Error boundaries
- Loading states (Skeleton)
- Empty states
- Data fetching with useQuery

### 2. **form-template.tsx** - Form Component
**When to use**: Creating forms with validation
**Pattern**: React Hook Form + Zod + shadcn/ui Form components
**Features**:
- Form validation with Zod
- Accessible error messages
- Loading states during submission
- Success/error feedback with toast notifications

### 3. **list-template.tsx** - Data List Component
**When to use**: Displaying collections of data
**Pattern**: TanStack Query + shadcn/ui Card
**Features**:
- Pagination or infinite scroll
- Sorting and filtering
- Empty states
- Action buttons (edit, delete)
- Optimistic updates

### 4. **modal-template.tsx** - Dialog/Modal Pattern
**When to use**: Creating dialogs or modals
**Pattern**: shadcn/ui Dialog + Form
**Features**:
- Focus trap
- Keyboard navigation (Escape to close)
- Accessible (ARIA labels)
- Controlled open/close state

### 5. **card-template.tsx** - Card Component
**When to use**: Displaying individual items
**Pattern**: shadcn/ui Card with hover effects
**Features**:
- Responsive design
- Hover and focus states
- Action buttons
- Status badges

---

## Form Examples

### 1. **simple-form.tsx** - Basic Form Pattern
Single-step form with text inputs, select, and submit button.

### 2. **multi-step-form.tsx** - Wizard Pattern
Multi-step form with progress indicator and navigation.

### 3. **conditional-fields.tsx** - Dynamic Fields
Form fields that appear/disappear based on other field values.

### 4. **optimistic-update.tsx** - Optimistic UI Pattern
Immediate UI update before server confirmation (with rollback on error).

---

## Layout Patterns

### 1. **dashboard-layout.tsx** - Dashboard Structure
Two-column layout with sidebar navigation and main content area.

### 2. **settings-layout.tsx** - Settings Page Pattern
Tabbed navigation for different settings sections.

### 3. **list-detail.tsx** - Master-Detail Pattern
Responsive layout: list on left, detail on right (stacked on mobile).

---

## Usage

Templates are starting points, not exact copies. Customize them based on:
- Feature requirements from PRD
- E2E test specifications
- Style Guide constraints
- Accessibility needs

**Example workflow**:
```
User: "Create a task creation form"
↓
Agent: Reads form-template.tsx
↓
Agent: Customizes template for task-specific fields
↓
Agent: Integrates with taskUseCases.createTask
↓
Agent: Adds translations (next-intl)
↓
Agent: Verifies E2E tests pass
```

---

## Adding New Templates

When creating a new template:
1. Ensure it follows Style Guide
2. Include all accessibility features
3. Add TypeScript types
4. Document usage in comments
5. Test with actual data

---

**Last Updated**: 2025-01-26
