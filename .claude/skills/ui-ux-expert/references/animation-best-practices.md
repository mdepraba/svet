# Animation Best Practices - Framer Motion & Tailwind

**Source**: Context7 `/grx7/framer-motion` + Tailwind CSS animations
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Animation Principles](#animation-principles)
2. [Tailwind CSS Animations](#tailwind-css-animations)
3. [Framer Motion Basics](#framer-motion-basics)
4. [Common Patterns](#common-patterns)
5. [Performance](#performance)
6. [Accessibility](#accessibility)

---

## Animation Principles

### Duration Guidelines (MANDATORY)

**Project Style Guide enforces ONLY these durations**:
- **200ms**: Micro-interactions (hover, focus)
- **300ms**: Standard transitions (fade, slide)
- **500ms**: Complex animations (page transitions)

**❌ PROHIBITED**: Arbitrary durations like `150ms`, `400ms`, `1000ms`

---

### Easing Functions

**Tailwind CSS easings**:
- `ease-linear`: Constant speed (rarely used)
- `ease-in`: Starts slow, ends fast (exit animations)
- `ease-out`: Starts fast, ends slow (entrance animations) ✅ **Most common**
- `ease-in-out`: Slow start and end (smooth transitions)

**Framer Motion springs** (natural motion):
- `type: "spring"`: Bouncy, natural feel
- `type: "tween"`: Linear interpolation (CSS-like)

---

### GPU-Accelerated Properties (CRITICAL)

**✅ FAST** (GPU-accelerated):
- `transform` (translate, scale, rotate)
- `opacity`

**❌ SLOW** (triggers layout/paint):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

**Example**:
```typescript
// ✅ CORRECT: Use transform
<div className="transition-transform duration-300 hover:scale-105">
  Hover me
</div>

// ❌ WRONG: Animating width (causes reflow)
<div className="transition-width duration-300 hover:w-[200px]">
  Hover me
</div>
```

---

## Tailwind CSS Animations

### Built-In Utilities

**Transition**:
```typescript
// All properties
<div className="transition-all duration-300 ease-out">
  Content
</div>

// Specific properties
<div className="transition-opacity duration-200">
  Fade
</div>

<div className="transition-transform duration-300">
  Move
</div>
```

---

### Hover Animations

**Scale on hover**:
```typescript
<Button className="transition-transform duration-200 hover:scale-105 active:scale-95">
  Click Me
</Button>
```

**Fade on hover**:
```typescript
<Card className="transition-opacity duration-300 hover:opacity-80">
  Hover to fade
</Card>
```

**Slide on hover**:
```typescript
<div className="group relative overflow-hidden">
  <div className="transition-transform duration-300 group-hover:translate-x-2">
    Slides right on hover
  </div>
</div>
```

---

### Loading Animations

**Spin**:
```typescript
import { Loader2 } from 'lucide-react'

<Loader2 className="h-6 w-6 animate-spin" />
```

**Pulse**:
```typescript
<div className="animate-pulse bg-muted rounded h-4 w-full" />
```

**Bounce**:
```typescript
<div className="animate-bounce">
  Bouncing element
</div>
```

---

### Skeleton Loaders

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function TaskCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

---

### Custom Tailwind Animations (Style Guide)

**If needed, add to `tailwind.config.ts`**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
```

**Usage**:
```typescript
<div className="animate-fade-in">
  Fades in
</div>
```

---

## Framer Motion Basics

### Installation (Already Installed)

```bash
npm install framer-motion
```

---

### Basic Animation

**Fade in**:
```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Slide up**:
```typescript
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

**Scale in**:
```typescript
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

### Variants Pattern (Recommended)

**Define animations separately**:
```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardTitle>{task.title}</CardTitle>
      </Card>
    </motion.div>
  )
}
```

---

### Stagger Children (List Animations)

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // 100ms delay between children
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {tasks.map((task) => (
        <motion.li key={task.id} variants={itemVariants}>
          <TaskCard task={task} />
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

---

### Exit Animations

**Wrap with AnimatePresence**:
```typescript
import { AnimatePresence, motion } from 'framer-motion'

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <AnimatePresence>
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TaskCard task={task} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

---

### Conditional Rendering

```typescript
import { AnimatePresence, motion } from 'framer-motion'

export function Notification({ message, isVisible }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## Common Patterns

### Page Transitions

```typescript
'use client'

import { motion } from 'framer-motion'

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
}

export default function TasksPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <h1>Tasks</h1>
      {/* Page content */}
    </motion.div>
  )
}
```

---

### Modal/Dialog Animations

**Backdrop fade + content scale**:
```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'

export function TaskDialog({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent asChild>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Content
              </motion.div>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
```

---

### Accordion/Collapse

```typescript
import { motion, AnimatePresence } from 'framer-motion'

export function Accordion({ title, children, isOpen }: Props) {
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {title}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### Hover Interactions

```typescript
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  <Button>Hover me</Button>
</motion.div>
```

---

### Drag and Drop

```typescript
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.1 }}
>
  Drag me
</motion.div>
```

---

## Performance

### Optimize Animations

**✅ DO**:
- Use `transform` and `opacity` only
- Enable `will-change` for complex animations
- Use `layoutId` for layout animations (shared element transitions)

**❌ DON'T**:
- Animate `width`, `height`, `left`, `top`
- Animate too many elements simultaneously
- Use long durations (>500ms)

---

### Layout Animations

**Shared element transitions**:
```typescript
<motion.div layoutId="task-123">
  <TaskCard task={task} />
</motion.div>

// On another page with same layoutId
<motion.div layoutId="task-123">
  <TaskDetail task={task} />
</motion.div>
```
Automatically animates position/size between pages.

---

### Reduce Motion (Accessibility)

**Respect user preferences**:
```typescript
import { useReducedMotion } from 'framer-motion'

export function TaskCard() {
  const shouldReduceMotion = useReducedMotion()

  const variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      Content
    </motion.div>
  )
}
```

**CSS approach**:
```typescript
<div className="transition-transform duration-300 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100">
  Respects prefers-reduced-motion
</div>
```

---

## Accessibility

### Animation Guidelines

1. **Respect `prefers-reduced-motion`** (MANDATORY)
2. **Keep durations short** (≤500ms)
3. **Avoid flashing/flickering** (can trigger seizures)
4. **Don't rely on animation alone** to convey information
5. **Ensure animations don't interfere** with keyboard navigation

---

### Testing Reduced Motion

**Enable in browser**:
- **Chrome**: DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`
- **Mac**: System Preferences → Accessibility → Display → Reduce motion
- **Windows**: Settings → Ease of Access → Display → Show animations

---

## Quick Reference

### Tailwind Transitions
```typescript
// Basic transition
className="transition-all duration-300 ease-out"

// Specific property
className="transition-transform duration-200"

// Hover effect
className="hover:scale-105 transition-transform duration-200"
```

### Framer Motion Fade In
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Framer Motion List
```typescript
<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### Exit Animation
```typescript
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

---

## Checklist

Before finalizing animations:

- [ ] **Only use approved durations** (200ms, 300ms, 500ms)
- [ ] **Animate only `transform` and `opacity`** for performance
- [ ] **Use `ease-out` for entrance**, `ease-in` for exit
- [ ] **Respect `prefers-reduced-motion`** with Tailwind or Framer Motion
- [ ] **Test on low-end devices** (no jank/lag)
- [ ] **Avoid flashing** (can trigger seizures)
- [ ] **Keep animations subtle** (don't distract from content)

---

**For latest Framer Motion patterns, consult**:
- Context7: `/grx7/framer-motion` - "variants AnimatePresence spring"
- Tailwind animations: `/tailwindlabs/tailwindcss.com` - "transition animation"
