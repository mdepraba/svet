# UI/UX Expert Skill References

References are loaded **on demand** when specific technical guidance is needed during UI implementation.

---

## Available References

### 1. **react-patterns.md** - React Best Practices
**When to consult**: Before implementing any React component
- Latest Hook patterns (useState, useEffect, useMemo, useCallback)
- Component composition strategies
- Performance optimization techniques
- Common anti-patterns to avoid
- **Context7 equivalent**: `/reactjs/react.dev` - "hooks best practices component patterns"

### 2. **shadcn-composition.md** - shadcn/ui Component Patterns
**When to consult**: When choosing or composing shadcn/ui components
- Component catalog and usage examples
- Composition patterns (Form, Dialog, Card, etc.)
- Built-in accessibility features
- Variant systems and customization
- **MCP equivalent**: `shadcn` MCP - search and view component details

### 3. **tailwind-responsive.md** - Responsive Design Patterns
**When to consult**: When implementing responsive layouts
- Mobile-first approach
- Breakpoint usage (sm, md, lg, xl, 2xl)
- Touch target sizing (44x44px minimum)
- Responsive typography and spacing
- **Context7 equivalent**: `/tailwindlabs/tailwindcss.com` - "responsive design breakpoints"

### 4. **accessibility-wcag.md** - WCAG 2.1 AA Compliance Checklist
**When to consult**: During accessibility validation phase
- Color contrast requirements (4.5:1 text, 3:1 UI)
- Keyboard navigation patterns
- ARIA labels and roles
- Screen reader compatibility
- Focus management
- **Context7 equivalent**: W3C WCAG 2.1 guidelines

### 5. **performance-web-vitals.md** - Core Web Vitals Optimization
**When to consult**: When optimizing component performance
- LCP optimization (Largest Contentful Paint <2.5s)
- FID optimization (First Input Delay <100ms)
- CLS prevention (Cumulative Layout Shift <0.1)
- Animation performance (60fps, GPU-accelerated)
- Image optimization (Next.js Image component)
- Bundle size management
- **Context7 equivalent**: `/vercel/next.js` - "performance optimization web vitals"

### 6. **tanstack-query-patterns.md** - Data Fetching Best Practices
**When to consult**: When integrating with use cases
- useQuery for reads
- useMutation for writes
- Optimistic updates
- Error handling patterns
- Loading states
- **Context7 equivalent**: `/tanstack/query` - "useQuery useMutation best practices"

### 7. **form-validation-patterns.md** - React Hook Form + Zod Integration
**When to consult**: When implementing forms
- Form component structure
- Zod schema integration with zodResolver
- Accessible error messages
- Multi-step forms
- Conditional fields
- **Context7 equivalent**: `/react-hook-form/react-hook-form` - "zodResolver validation"

### 8. **animation-best-practices.md** - Framer Motion & Tailwind Animations
**When to consult**: When adding animations or transitions
- Animation duration guidelines (200ms, 300ms, 500ms)
- GPU-accelerated properties (transform, opacity)
- Framer Motion patterns (variants, spring animations)
- Accessibility considerations (prefers-reduced-motion)
- **Context7 equivalent**: `/grx7/framer-motion` - "best practices variants spring"

---

## Update Policy

References should be refreshed when:
- Context7 documentation changes
- New React/Next.js/Tailwind versions released
- shadcn/ui adds new components
- WCAG guidelines updated
- Common mistakes are identified

---

## Loading Pattern

References are NOT loaded upfront. They are loaded on demand:

1. Agent encounters a specific need (e.g., "How to implement responsive forms?")
2. Agent reads the relevant reference (e.g., `tailwind-responsive.md` + `form-validation-patterns.md`)
3. Agent applies the guidance to the current implementation
4. Agent optionally consults Context7 for latest updates

**Example workflow**:
```
User: "Create a responsive login form"
↓
Agent: Reads form-validation-patterns.md + tailwind-responsive.md
↓
Agent: Consults Context7 for latest React Hook Form patterns
↓
Agent: Implements form following both reference and Context7 guidance
```

---

**Last Updated**: 2025-01-26
