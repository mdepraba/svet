# UI/UX Expert Skill

**Version**: 1.0.0
**Agent**: ui-ux-expert
**Status**: Active

---

## Purpose

This skill provides the complete technical workflow for the `ui-ux-expert` agent, covering:

- **Component Design**: React component architecture and composition patterns
- **Implementation**: shadcn/ui + Tailwind CSS + TanStack Query integration
- **Accessibility**: WCAG 2.1 AA compliance and keyboard navigation
- **Performance**: Core Web Vitals optimization and animation best practices
- **Validation**: Chrome DevTools MCP for visual verification
- **Style Guide**: Mandatory compliance with project's visual standards

---

## Structure

```
ui-ux-expert-skill/
├── SKILL.md                    # Main technical workflow (6 phases)
├── metadata.json               # Skill metadata
├── README.md                   # This file
├── references/                 # Reference documents (loaded on demand)
│   ├── README.md              # Index of references
│   ├── react-patterns.md      # React best practices
│   ├── shadcn-composition.md  # shadcn/ui component patterns
│   ├── tailwind-responsive.md # Responsive design patterns
│   ├── accessibility-wcag.md  # WCAG 2.1 AA checklist
│   └── performance-web-vitals.md # Core Web Vitals optimization
├── scripts/                    # Automation scripts
│   └── README.md              # Script documentation
└── assets/                     # Templates, examples, diagrams
    ├── component-templates/    # Reusable component patterns
    ├── form-examples/          # React Hook Form + Zod patterns
    └── README.md              # Asset catalog
```

---

## Usage

The skill is invoked automatically by the `ui-ux-expert` agent at the start of each iteration:

```
Skill: ui-ux-expert-skill
```

Once invoked, the agent follows the 6-phase workflow defined in `SKILL.md`.

---

## Workflow Overview

**Phase 0**: Style Guide Study (MANDATORY first step)
**Phase 1**: Component Research (shadcn MCP + Context7)
**Phase 2**: Design Architecture (composition patterns)
**Phase 3**: Implementation (React + Tailwind + shadcn/ui)
**Phase 4**: Validation (Chrome DevTools MCP + accessibility)
**Phase 5**: Documentation (iteration file with screenshots)

---

## MCP Integrations

This skill requires the following MCPs:

1. **Context7**: Latest React, Next.js, Tailwind CSS, TanStack Query best practices
2. **shadcn MCP**: Component patterns, composition examples, accessibility features
3. **Chrome DevTools**: Visual validation, accessibility audits, performance metrics

---

## Key Technologies

- React 18+ (Hooks, Suspense, Server Components awareness)
- Next.js 14+ App Router (Client Components, `'use client'` directive)
- shadcn/ui (Base component library)
- Aceternity UI (Advanced effects and animations)
- Tailwind CSS (Utility-first styling, mobile-first responsive)
- TanStack Query (Server state management)
- React Hook Form (Form state + validation)
- Zod (Schema validation)
- Playwright (E2E test specifications)
- Framer Motion (Advanced animations)
- next-intl (Internationalization)

---

## Success Criteria

A UI implementation is complete when:

- ✅ 100% E2E tests passing
- ✅ Lighthouse accessibility score >90
- ✅ WCAG 2.1 AA compliant
- ✅ Core Web Vitals green (LCP <2.5s, FID <100ms, CLS <0.1)
- ✅ Style Guide compliance 100%
- ✅ Cross-browser compatibility verified
- ✅ Screenshots captured at all breakpoints (mobile, tablet, desktop)
- ✅ Documented in iteration file

---

**For complete technical workflow, see**: `SKILL.md`
