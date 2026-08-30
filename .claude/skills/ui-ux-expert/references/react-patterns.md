# React Best Practices & Patterns

**Source**: Context7 `/reactjs/react.dev` + Project experience
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Hook Patterns](#hook-patterns)
2. [Component Composition](#component-composition)
3. [Performance Optimization](#performance-optimization)
4. [Common Anti-Patterns](#common-anti-patterns)
5. [Custom Hooks](#custom-hooks)

---

## Hook Patterns

### useState - State Management

**Basic usage**:
```typescript
const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)
```

**Lazy initialization** (expensive computation):
```typescript
const [data, setData] = useState(() => {
  return expensiveComputation()
})
```

**Functional updates** (when new state depends on previous):
```typescript
setCount(prev => prev + 1)  // ✅ Safe with concurrent features
setCount(count + 1)         // ❌ May use stale value
```

---

### useEffect - Side Effects

**⚠️ CRITICAL**: DO NOT use useEffect for data fetching. Use TanStack Query.

**Valid use cases**:
1. Synchronizing with external systems (WebSocket, DOM APIs)
2. Setting up event listeners
3. Browser APIs (localStorage, etc.)

**Pattern**:
```typescript
useEffect(() => {
  // Setup
  const connection = createConnection()
  connection.connect()

  // Cleanup
  return () => {
    connection.disconnect()
  }
}, [dependencies])
```

**Common mistakes**:
```typescript
// ❌ WRONG: Fetching data
useEffect(() => {
  fetch('/api/tasks').then(setTasks)
}, [])

// ✅ CORRECT: Use TanStack Query
const { data: tasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks
})
```

---

### useMemo - Memoize Expensive Calculations

**When to use**: Expensive computations that don't need to re-run every render.

**Pattern**:
```typescript
const visibleTodos = useMemo(() => {
  return filterTodos(todos, filter) // Expensive operation
}, [todos, filter])
```

**Memoizing JSX nodes**:
```typescript
const children = useMemo(() => (
  <ExpensiveComponent data={data} />
), [data])
```

**When NOT to use**: Simple computations (addition, concatenation).

---

### useCallback - Memoize Functions

**When to use**: Passing callbacks to memoized children or effect dependencies.

**Pattern**:
```typescript
const handleClick = useCallback((id: string) => {
  console.log('Clicked', id)
}, []) // Dependencies array

// Pass to child component
<MemoizedChild onClick={handleClick} />
```

**With dependencies**:
```typescript
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data, userId)
}, [userId]) // Re-create when userId changes
```

---

### useRef - DOM References & Mutable Values

**DOM access**:
```typescript
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])

return <input ref={inputRef} />
```

**Mutable value** (doesn't trigger re-render):
```typescript
const countRef = useRef(0)

const handleClick = () => {
  countRef.current += 1
  console.log(countRef.current) // Updates without re-render
}
```

---

### useContext - Context Consumption

**Pattern**:
```typescript
const theme = useContext(ThemeContext)
const user = useContext(UserContext)
```

**Custom hook for context** (recommended):
```typescript
// Create custom hook
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// Usage in components
const theme = useTheme()
```

---

## Component Composition

### Pass JSX as Children (Preferred)

**✅ CORRECT**: Flexible, state-preserving
```typescript
function Button({ color, children }: ButtonProps) {
  return (
    <button style={{ backgroundColor: color }}>
      {children}
    </button>
  )
}

// Usage
<Button color="red">
  <Icon />
  Click Me
</Button>
```

**❌ WRONG**: Factory functions
```typescript
// ❌ Don't create component factories
function createButton(color: string) {
  return function Button() {
    return <button style={{ backgroundColor: color }}>Click</button>
  }
}
```

---

### Render Props (When Needed)

**Use case**: Sharing stateful logic between components.

```typescript
interface RenderProps {
  data: Data
  isLoading: boolean
}

function DataProvider({ render }: { render: (props: RenderProps) => ReactNode }) {
  const [data, setData] = useState<Data | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Logic here...

  return render({ data, isLoading })
}

// Usage
<DataProvider render={({ data, isLoading }) => (
  isLoading ? <Spinner /> : <Display data={data} />
)} />
```

---

### Component as Prop

```typescript
interface LayoutProps {
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
}

function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div>
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  )
}

// Usage
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <Content />
</Layout>
```

---

## Performance Optimization

### Calculate During Render (Preferred)

**✅ CORRECT**: Derived state computed during render
```typescript
function Form() {
  const [firstName, setFirstName] = useState('Taylor')
  const [lastName, setLastName] = useState('Swift')

  // ✅ Calculated during rendering
  const fullName = firstName + ' ' + lastName

  return <div>{fullName}</div>
}
```

**❌ WRONG**: Unnecessary state + useEffect
```typescript
function Form() {
  const [firstName, setFirstName] = useState('Taylor')
  const [lastName, setLastName] = useState('Swift')
  const [fullName, setFullName] = useState('')

  // ❌ Redundant state and effect
  useEffect(() => {
    setFullName(firstName + ' ' + lastName)
  }, [firstName, lastName])

  return <div>{fullName}</div>
}
```

---

### React.memo for Expensive Children

**When to use**: Child component re-renders often with same props.

```typescript
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }: Props) {
  // Expensive rendering logic
  return <div>{processData(data)}</div>
})

// Parent component
function Parent() {
  const [count, setCount] = useState(0)
  const data = useMemo(() => computeData(), [])

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {/* ExpensiveComponent won't re-render when count changes */}
      <ExpensiveComponent data={data} />
    </>
  )
}
```

---

## Common Anti-Patterns

### ❌ Factory Functions Creating Components

**Problem**: Components recreated every render, losing state.

```typescript
// ❌ WRONG
function Parent() {
  function Child() {  // Recreated every render
    const [count, setCount] = useState(0)
    return <div>{count}</div>
  }

  return <Child />  // State lost on every render
}

// ✅ CORRECT
function Child() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}

function Parent() {
  return <Child />
}
```

---

### ❌ Custom "Lifecycle" Hooks

**Problem**: Bypasses linter, overlooks dependencies.

```typescript
// ❌ WRONG: Custom useMount hook
function useMount(fn: () => void) {
  useEffect(() => {
    fn()
  }, [])  // Missing 'fn' dependency
}

// Usage
useMount(() => {
  fetchData(userId)  // userId dependency not tracked
})

// ✅ CORRECT: Use useEffect directly
useEffect(() => {
  fetchData(userId)
}, [userId])  // Linter catches missing dependencies
```

---

### ❌ Passing Hooks as Props

**Problem**: Dynamic hook calls violate Rules of Hooks.

```typescript
// ❌ WRONG
function Component({ useCustomHook }: { useCustomHook: () => Data }) {
  const data = useCustomHook()  // Hook call depends on prop
  return <div>{data}</div>
}

// ✅ CORRECT: Call hook directly
function Component() {
  const data = useCustomHook()
  return <div>{data}</div>
}
```

---

## Custom Hooks

### Pattern: Extract Reusable Logic

```typescript
// Custom hook for form field
function useFormField(initialValue: string) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  const validate = (value: string) => {
    if (value.length < 3) {
      setError('Too short')
      return false
    }
    setError(null)
    return true
  }

  return {
    value,
    setValue,
    error,
    validate,
    inputProps: {
      value,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    },
  }
}

// Usage
function LoginForm() {
  const email = useFormField('')
  const password = useFormField('')

  const handleSubmit = () => {
    if (email.validate(email.value) && password.validate(password.value)) {
      login(email.value, password.value)
    }
  }

  return (
    <form>
      <input {...email.inputProps} />
      {email.error && <span>{email.error}</span>}

      <input {...password.inputProps} type="password" />
      {password.error && <span>{password.error}</span>}

      <button onClick={handleSubmit}>Login</button>
    </form>
  )
}
```

---

### Pattern: Custom Hook for Context

```typescript
// Create context with custom hook
const TasksContext = createContext<Task[] | null>(null)

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider')
  }
  return context
}

// Provider
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  // ... logic
  return (
    <TasksContext.Provider value={tasks}>
      {children}
    </TasksContext.Provider>
  )
}

// Usage in components
function TaskList() {
  const tasks = useTasks()  // Clean, type-safe
  return <div>{tasks.map(...)}</div>
}
```

---

## Quick Reference

### When to Use Each Hook

| Hook | Use Case | Example |
|------|----------|---------|
| `useState` | Component state | Form inputs, toggles |
| `useEffect` | Side effects, external sync | WebSocket, event listeners |
| `useMemo` | Expensive calculations | Filtering large lists |
| `useCallback` | Memoize functions | Callbacks to memoized children |
| `useRef` | DOM access, mutable values | Focus input, store prev value |
| `useContext` | Consume context | Theme, auth, global state |

### Performance Tips

1. **Calculate during render** for simple derived state
2. **useMemo** for expensive computations
3. **useCallback** for callbacks to memoized children
4. **React.memo** for expensive components with stable props
5. **Avoid premature optimization** - measure first

---

**For latest patterns, always consult Context7**: `/reactjs/react.dev`
