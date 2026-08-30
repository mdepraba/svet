# Core Web Vitals & Performance Optimization

**Source**: Context7 `/vercel/next.js` + Web Vitals documentation
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Core Web Vitals Overview](#core-web-vitals-overview)
2. [LCP Optimization](#lcp-optimization)
3. [FID/INP Optimization](#fidinp-optimization)
4. [CLS Prevention](#cls-prevention)
5. [Image Optimization](#image-optimization)
6. [Code Splitting](#code-splitting)
7. [React Performance](#react-performance)
8. [Bundle Size](#bundle-size)

---

## Core Web Vitals Overview

### The Three Metrics (WCAG Requirements)

| Metric | What It Measures | Target | Max Acceptable |
|--------|------------------|--------|----------------|
| **LCP** | Largest Contentful Paint | **< 2.5s** | < 4.0s |
| **FID/INP** | First Input Delay / Interaction to Next Paint | **< 100ms** | < 300ms |
| **CLS** | Cumulative Layout Shift | **< 0.1** | < 0.25 |

**Good score**: ≥ 75% of page loads meet "Target" thresholds

---

### Measuring Web Vitals

**Development** (Chrome DevTools):
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

**Production** (Real User Monitoring):
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Chrome DevTools MCP** (during validation phase):
```typescript
// Capture performance metrics
await mcp__chrome_devtools__evaluate_script({
  script: `
    const metrics = await performance.getEntriesByType('navigation');
    JSON.stringify(metrics[0], null, 2);
  `
})
```

---

## LCP Optimization

### What Affects LCP?

**LCP elements** (typically):
- Hero images
- Large text blocks
- Video thumbnails
- Background images loaded via CSS

**Target**: Visible within **2.5 seconds**

---

### Optimization Strategies

#### 1. **Use Next.js Image Component** (MANDATORY)

**❌ WRONG** (standard img tag):
```typescript
<img src="/hero.png" alt="Hero" />
```

**✅ CORRECT** (Next.js Image):
```typescript
import Image from 'next/image'

<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Loads immediately (no lazy loading)
/>
```

**Why?**
- Automatic WebP/AVIF conversion
- Responsive srcset generation
- Lazy loading by default
- Prevents CLS with width/height

---

#### 2. **Prioritize LCP Resource**

**Add `priority` prop** to above-the-fold images:
```typescript
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority  // ⚠️ Critical for LCP
/>
```

**Preload fonts** (if text is LCP):
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // Prevents FOIT (Flash of Invisible Text)
})

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

---

#### 3. **Optimize Server Response Time**

**Use React Server Components** (Next.js App Router):
```typescript
// app/tasks/page.tsx (Server Component by default)
export default async function TasksPage() {
  const tasks = await taskUseCases.getTasks()  // Fetched on server

  return <TaskList tasks={tasks} />
}
```

**Benefits**:
- No client-side fetch delay
- HTML contains data immediately
- Faster LCP

---

#### 4. **Reduce Render-Blocking Resources**

**Inline critical CSS** (Tailwind does this automatically)

**Defer non-critical scripts**:
```typescript
<Script src="/analytics.js" strategy="lazyOnload" />
```

---

## FID/INP Optimization

### What Affects FID/INP?

**FID** (First Input Delay): Time from first click to browser response
**INP** (Interaction to Next Paint): Time from any interaction to visual update

**Target**: **< 100ms**

---

### Optimization Strategies

#### 1. **Minimize JavaScript Execution**

**Code split heavy components**:
```typescript
import dynamic from 'next/dynamic'

// Load chart library only when needed
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false,  // Don't render on server
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Chart data={data} />
    </div>
  )
}
```

---

#### 2. **Use Web Workers for Heavy Computation**

**Offload processing**:
```typescript
// worker.ts
self.onmessage = (e) => {
  const result = expensiveComputation(e.data)
  self.postMessage(result)
}

// Component
const worker = new Worker(new URL('./worker.ts', import.meta.url))

worker.postMessage(data)
worker.onmessage = (e) => {
  setResult(e.data)
}
```

---

#### 3. **Debounce/Throttle Event Handlers**

**Limit execution frequency**:
```typescript
import { useDebouncedCallback } from 'use-debounce'

export function SearchInput() {
  const [query, setQuery] = useState('')

  const debouncedSearch = useDebouncedCallback((value: string) => {
    performSearch(value)
  }, 300)  // Wait 300ms after typing stops

  return (
    <Input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        debouncedSearch(e.target.value)
      }}
    />
  )
}
```

---

#### 4. **Optimize React Rendering**

**Avoid unnecessary re-renders**:
```typescript
// ✅ CORRECT: Memoize expensive child
const TaskList = React.memo(function TaskList({ tasks }: Props) {
  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
})

// Parent component
export function TasksPage() {
  const [filter, setFilter] = useState('')
  const tasks = useMemo(() => filterTasks(allTasks, filter), [allTasks, filter])

  return <TaskList tasks={tasks} />  // Only re-renders when tasks change
}
```

---

## CLS Prevention

### What Causes CLS?

**Layout shifts** happen when:
- Images load without dimensions
- Fonts load and change size (FOIT/FOUT)
- Ads/embeds inject dynamically
- Animations move content

**Target**: **< 0.1**

---

### Prevention Strategies

#### 1. **Reserve Space for Images** (CRITICAL)

**❌ WRONG** (no dimensions):
```typescript
<img src="/avatar.png" alt="Avatar" />
```

**✅ CORRECT** (explicit dimensions):
```typescript
<Image
  src="/avatar.png"
  alt="Avatar"
  width={40}
  height={40}
/>
```

---

#### 2. **Use Skeleton Loaders**

**Reserve space for async content**:
```typescript
import { Skeleton } from "@/components/ui/skeleton"

export function TaskCard() {
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskUseCases.getTask(id),
  })

  if (isLoading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription>{task.description}</CardDescription>
      </CardHeader>
      <CardContent>{task.content}</CardContent>
    </Card>
  )
}
```

---

#### 3. **Font Loading Strategy**

**Use `display: swap`** (Next.js fonts do this automatically):
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // Shows fallback font immediately, swaps when loaded
})
```

**Preload fonts**:
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <head>
        <link
          rel="preload"
          href="/fonts/custom-font.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

#### 4. **Avoid Inserting Content Above Existing Content**

**❌ WRONG** (pushes content down):
```typescript
{showBanner && <Banner />}
<Content />
```

**✅ CORRECT** (overlays or bottom):
```typescript
<div className="relative">
  <Content />
  {showBanner && (
    <div className="fixed bottom-4 right-4">
      <Banner />
    </div>
  )}
</div>
```

---

## Image Optimization

### Next.js Image Component (Best Practices)

**Responsive images**:
```typescript
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority
/>
```

**Fill container** (responsive height):
```typescript
<div className="relative w-full h-[400px]">
  <Image
    src="/hero.png"
    alt="Hero"
    fill
    className="object-cover"
    sizes="100vw"
    priority
  />
</div>
```

**Placeholder blur**:
```typescript
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

---

### Remote Images (Supabase Storage)

**Configure domains** (next.config.js):
```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}
```

**Usage**:
```typescript
<Image
  src="https://xxx.supabase.co/storage/v1/object/public/avatars/user.png"
  alt="User avatar"
  width={40}
  height={40}
/>
```

---

## Code Splitting

### Dynamic Imports

**Lazy load heavy components**:
```typescript
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false,  // Client-only component
})

export default function CommentForm() {
  return (
    <div>
      <Label>Comment</Label>
      <RichTextEditor />
    </div>
  )
}
```

---

### Route-Based Code Splitting

**Next.js does this automatically**:
```
app/
├── tasks/
│   └── page.tsx       → /tasks bundle
├── projects/
│   └── page.tsx       → /projects bundle
└── settings/
    └── page.tsx       → /settings bundle
```

Each route gets its own bundle, loaded only when visited.

---

## React Performance

### useMemo for Expensive Calculations

```typescript
const filteredTasks = useMemo(() => {
  return tasks.filter((task) => task.status === filter)
}, [tasks, filter])  // Only recompute when tasks or filter change
```

---

### useCallback for Memoized Functions

```typescript
const TaskList = React.memo(function TaskList({ onTaskClick }: Props) {
  // ...
})

export function TasksPage() {
  const handleTaskClick = useCallback((taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }, [router])

  return <TaskList onTaskClick={handleTaskClick} />
}
```

---

### Virtualization (Long Lists)

**Use react-window for 100+ items**:
```typescript
import { FixedSizeList } from 'react-window'

export function TaskList({ tasks }: { tasks: Task[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

---

## Bundle Size

### Analyze Bundle

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build
```

**next.config.js**:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ...config
})
```

---

### Tree Shaking

**Import only what you need**:
```typescript
// ❌ WRONG: Imports entire library
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ CORRECT: Imports only debounce
import debounce from 'lodash/debounce'
debounce(fn, 300)
```

---

### Remove Unused Dependencies

```bash
npx depcheck
```

---

## Quick Checklist

Before finalizing UI implementation:

### LCP (< 2.5s)
- [ ] Hero/LCP images use Next.js `<Image priority>`
- [ ] Fonts preloaded with `display: swap`
- [ ] Server Components fetch data on server

### FID/INP (< 100ms)
- [ ] Heavy components code-split with `dynamic()`
- [ ] Event handlers debounced/throttled
- [ ] Expensive computations memoized

### CLS (< 0.1)
- [ ] All images have `width` and `height`
- [ ] Skeleton loaders for async content
- [ ] No content inserted above existing content

### Images
- [ ] All images use Next.js `<Image>`
- [ ] Remote domains configured in `next.config.js`
- [ ] Responsive `sizes` attribute set

### Bundle
- [ ] No unused dependencies
- [ ] Tree shaking enabled (imports only what's needed)
- [ ] Heavy libraries lazy loaded

---

**For latest Next.js performance patterns, consult**:
- Context7: `/vercel/next.js` - "performance optimization image"
- Web Vitals: https://web.dev/vitals/
