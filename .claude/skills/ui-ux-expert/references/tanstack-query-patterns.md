# TanStack Query Data Fetching Best Practices

**Source**: Context7 `/tanstack/query` + Project experience
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [useQuery - Data Fetching](#usequery---data-fetching)
3. [useMutation - Data Modification](#usemutation---data-modification)
4. [Optimistic Updates](#optimistic-updates)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Cache Invalidation](#cache-invalidation)
8. [Query Keys](#query-keys)

---

## Core Concepts

### Why TanStack Query?

**❌ PROHIBITED** (useEffect for data fetching):
```typescript
// ❌ WRONG: Manual data fetching
const [tasks, setTasks] = useState<Task[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  taskUseCases.getTasks()
    .then(setTasks)
    .finally(() => setIsLoading(false))
}, [])
```

**✅ CORRECT** (TanStack Query):
```typescript
import { useQuery } from '@tanstack/react-query'

const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks,
})
```

**Benefits**:
- Automatic caching
- Background refetching
- Deduplication (no duplicate requests)
- Loading/error states built-in
- Optimistic updates
- Automatic retries

---

### Setup (Already Configured)

**QueryClientProvider** (in `app/src/app/providers.tsx`):
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,  // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Wrap app** (in `app/layout.tsx`):
```typescript
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

## useQuery - Data Fetching

### Basic Usage

**Fetch list**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { taskUseCases } from '@/features/tasks/use-cases'

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskUseCases.getTasks,
  })

  if (isLoading) return <TaskListSkeleton />
  if (error) return <ErrorMessage error={error} />

  return <TaskList tasks={tasks} />
}
```

**Fetch single item**:
```typescript
export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', params.id],
    queryFn: () => taskUseCases.getTask(params.id),
  })

  if (isLoading) return <TaskDetailSkeleton />

  return <TaskDetail task={task} />
}
```

---

### Query Keys (CRITICAL)

**Query keys identify queries** - they must be unique and consistent.

**Pattern**: `['resource', ...identifiers]`

```typescript
// List queries
['tasks']
['projects']
['users']

// Detail queries
['tasks', taskId]
['projects', projectId]

// Filtered queries
['tasks', { status: 'completed' }]
['tasks', { assignee: userId }]

// Nested queries
['projects', projectId, 'tasks']
['organizations', orgId, 'members']
```

**✅ CORRECT** (consistent keys):
```typescript
// Fetch tasks
const { data: tasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks,
})

// Invalidate tasks after creation
queryClient.invalidateQueries({ queryKey: ['tasks'] })
```

**❌ WRONG** (inconsistent keys):
```typescript
// Fetch with key ['tasks']
useQuery({ queryKey: ['tasks'], queryFn: getTasks })

// Invalidate with different key ['task-list']
queryClient.invalidateQueries({ queryKey: ['task-list'] })  // Won't work!
```

---

### Dependent Queries

**Fetch user, then their tasks**:
```typescript
export function UserDashboard({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userUseCases.getUser(userId),
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', { assignee: userId }],
    queryFn: () => taskUseCases.getTasks({ assignee: userId }),
    enabled: !!user,  // Only fetch tasks after user is loaded
  })

  return (
    <div>
      <h1>{user?.name}'s Tasks</h1>
      <TaskList tasks={tasks} />
    </div>
  )
}
```

---

### Pagination

**Paginated queries**:
```typescript
export function TasksPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['tasks', { page }],
    queryFn: () => taskUseCases.getTasks({ page, limit: 10 }),
    placeholderData: (previousData) => previousData,  // Keep previous data while loading
  })

  return (
    <div>
      <TaskList tasks={data?.tasks} />
      <div className="flex gap-2 justify-center mt-4">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={isPlaceholderData || !data?.hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

---

### Infinite Scroll

**Infinite queries**:
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

export function InfiniteTaskList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tasks', 'infinite'],
    queryFn: ({ pageParam = 1 }) => taskUseCases.getTasks({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  return (
    <div>
      {data?.pages.map((page) => (
        page.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))
      ))}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  )
}
```

---

## useMutation - Data Modification

### Basic Usage

**Create mutation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskUseCases } from '@/features/tasks/use-cases'
import { useToast } from '@/hooks/use-toast'

export function CreateTaskForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const createMutation = useMutation({
    mutationFn: taskUseCases.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Success',
        description: 'Task created successfully',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

  const handleSubmit = (data: CreateTaskInput) => {
    createMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  )
}
```

---

### Update Mutation

```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
    taskUseCases.updateTask(id, data),
  onSuccess: (updatedTask) => {
    // Update specific task in cache
    queryClient.setQueryData(['tasks', updatedTask.id], updatedTask)
    // Invalidate list
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})

// Usage
updateMutation.mutate({ id: '123', data: { title: 'New Title' } })
```

---

### Delete Mutation

```typescript
const deleteMutation = useMutation({
  mutationFn: taskUseCases.deleteTask,
  onSuccess: (_, taskId) => {
    // Remove from cache
    queryClient.removeQueries({ queryKey: ['tasks', taskId] })
    // Invalidate list
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})

// Usage with confirmation dialog
<AlertDialog>
  <AlertDialogAction onClick={() => deleteMutation.mutate(taskId)}>
    Delete
  </AlertDialogAction>
</AlertDialog>
```

---

## Optimistic Updates

### Pattern (Immediate UI Update)

**Optimistic create**:
```typescript
const createMutation = useMutation({
  mutationFn: taskUseCases.createTask,
  onMutate: async (newTask) => {
    // Cancel outgoing queries (prevent overwriting our optimistic update)
    await queryClient.cancelQueries({ queryKey: ['tasks'] })

    // Snapshot current state
    const previousTasks = queryClient.getQueryData(['tasks'])

    // Optimistically update cache
    queryClient.setQueryData(['tasks'], (old: Task[] = []) => {
      return [
        ...old,
        { ...newTask, id: 'temp-id', createdAt: new Date() },  // Temporary ID
      ]
    })

    // Return context with snapshot
    return { previousTasks }
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context?.previousTasks)
  },
  onSettled: () => {
    // Refetch to get real data from server
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

**Optimistic update**:
```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
    taskUseCases.updateTask(id, data),
  onMutate: async ({ id, data }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks', id] })

    const previousTask = queryClient.getQueryData(['tasks', id])

    queryClient.setQueryData(['tasks', id], (old: Task) => ({
      ...old,
      ...data,
    }))

    return { previousTask }
  },
  onError: (err, { id }, context) => {
    queryClient.setQueryData(['tasks', id], context?.previousTask)
  },
  onSettled: (data, error, { id }) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', id] })
  },
})
```

---

## Error Handling

### Component-Level Error Handling

```typescript
export function TasksPage() {
  const { data: tasks, error, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskUseCases.getTasks,
  })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load tasks</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return <TaskList tasks={tasks} />
}
```

---

### Global Error Handling (Query Defaults)

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        // Global error logging
        console.error('Query error:', error)
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handling
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        })
      },
    },
  },
})
```

---

## Loading States

### Query Loading States

```typescript
const { data, isLoading, isFetching, isRefetching } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks,
})

// isLoading: True on FIRST load (no cached data)
// isFetching: True on ANY fetch (including background refetch)
// isRefetching: True on refetch when data already exists
```

**Use Skeleton for initial load**:
```typescript
if (isLoading) return <TaskListSkeleton />
if (!data) return null

return (
  <div>
    {isFetching && <LoadingSpinner className="fixed top-4 right-4" />}
    <TaskList tasks={data} />
  </div>
)
```

---

### Mutation Loading States

```typescript
const mutation = useMutation({
  mutationFn: taskUseCases.createTask,
})

// mutation.isPending: True while mutation is in progress
// mutation.isSuccess: True after successful mutation
// mutation.isError: True if mutation failed

<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Creating...
    </>
  ) : (
    'Create Task'
  )}
</Button>
```

---

## Cache Invalidation

### Invalidate Queries

**After mutation**:
```typescript
const createMutation = useMutation({
  mutationFn: taskUseCases.createTask,
  onSuccess: () => {
    // Invalidate all queries with 'tasks' key
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

**Invalidate specific query**:
```typescript
// Invalidate single task
queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })

// Invalidate all task lists
queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false })
```

**Invalidate multiple queries**:
```typescript
await queryClient.invalidateQueries({ queryKey: ['tasks'] })
await queryClient.invalidateQueries({ queryKey: ['projects'] })
```

---

### Refetch Queries

**Force refetch**:
```typescript
queryClient.refetchQueries({ queryKey: ['tasks'] })
```

**Refetch on window focus** (default behavior):
```typescript
const { data } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks,
  refetchOnWindowFocus: true,  // Default
})
```

---

## Query Keys

### Best Practices

**Hierarchical keys** (recommended):
```typescript
// Top-level resource
['tasks']

// Specific resource
['tasks', taskId]

// Filtered/sorted list
['tasks', { status: 'completed' }]
['tasks', { assignee: userId, status: 'in-progress' }]

// Nested resources
['projects', projectId, 'tasks']
['organizations', orgId, 'members']
```

**Key factory pattern**:
```typescript
// features/tasks/queries.ts
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Usage
useQuery({ queryKey: taskKeys.detail(taskId), queryFn: ... })
queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
```

---

## Quick Reference

### useQuery Pattern
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => useCases.get(id),
})
```

### useMutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: useCases.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource'] }),
})
```

### Optimistic Update Pattern
```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ['resource'] })
  const previous = queryClient.getQueryData(['resource'])
  queryClient.setQueryData(['resource'], (old) => [...old, newData])
  return { previous }
},
onError: (err, newData, context) => {
  queryClient.setQueryData(['resource'], context?.previous)
},
```

---

**For latest TanStack Query patterns, consult**:
- Context7: `/tanstack/query` - "useQuery useMutation optimistic updates"
- Official docs: https://tanstack.com/query/latest
