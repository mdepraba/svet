# shadcn/ui Component Patterns & Composition

**Source**: shadcn MCP + Context7 `/shadcn/ui` + Project experience
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Form Components](#form-components)
3. [Dialog & Modal Patterns](#dialog--modal-patterns)
4. [Data Display](#data-display)
5. [Navigation Components](#navigation-components)
6. [Feedback Components](#feedback-components)
7. [Composition Patterns](#composition-patterns)

---

## Core Principles

### What is shadcn/ui?

shadcn/ui is **NOT a component library** - it's a collection of **copy-paste components** that you own.

**Key characteristics**:
- Components copied directly into your project (`components/ui/`)
- Built with Radix UI primitives (accessible by default)
- Styled with Tailwind CSS
- Fully customizable (you own the code)
- TypeScript support out of the box

### Installation Pattern

```bash
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add dialog
```

**Result**: Component files appear in `components/ui/` - you can modify them.

---

## Form Components

### Button Component

**Basic usage**:
```typescript
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small</Button>
<Button disabled>Disabled</Button>
```

**Variants** (defined in `button.tsx`):
- `default` - Primary action
- `destructive` - Delete/remove actions
- `outline` - Secondary action
- `secondary` - Tertiary action
- `ghost` - Minimal style
- `link` - Text link style

**Sizes**:
- `default` - Standard 44px height (touch-friendly)
- `sm` - Small 36px
- `lg` - Large 52px
- `icon` - Square for icon-only buttons

**Custom variant example**:
```typescript
// In components/ui/button.tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Add custom variant
        success: "bg-green-600 text-white hover:bg-green-700",
      }
    }
  }
)
```

---

### Input Component

**Text input**:
```typescript
import { Input } from "@/components/ui/input"

<Input
  type="email"
  placeholder="email@example.com"
  aria-label="Email address"
/>
```

**With label**:
```typescript
import { Label } from "@/components/ui/label"

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>
```

**Disabled state**:
```typescript
<Input disabled placeholder="Cannot edit" />
```

---

### Form Component (with React Hook Form)

**⚠️ CRITICAL**: Always use shadcn Form with React Hook Form + Zod

**Pattern**:
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Key components**:
- `<Form>` - Wraps the entire form, spreads form methods
- `<FormField>` - Connects to React Hook Form field
- `<FormItem>` - Container for label + input + message
- `<FormLabel>` - Accessible label (linked to input)
- `<FormControl>` - Wraps the actual input component
- `<FormMessage>` - Shows validation errors automatically
- `<FormDescription>` - Optional help text

---

### Select Component

**Basic select**:
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

**With Form integration**:
```typescript
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Dialog & Modal Patterns

### Dialog Component

**Basic dialog**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Controlled dialog** (recommended):
```typescript
export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <TaskForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

**Dialog with form** (common pattern):
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField ... />
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

---

### Alert Dialog (Confirmation)

**Destructive action confirmation**:
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Task</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the task.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Data Display

### Card Component

**Basic card**:
```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Task Title</CardTitle>
    <CardDescription>Created 2 days ago</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Task description goes here</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Edit</Button>
  </CardFooter>
</Card>
```

**Interactive card** (clickable):
```typescript
<Card className="cursor-pointer hover:bg-accent transition-colors">
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p>12 tasks • 3 members</p>
  </CardContent>
</Card>
```

---

### Table Component

**Data table pattern**:
```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>A list of your recent tasks</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {tasks.map((task) => (
      <TableRow key={task.id}>
        <TableCell className="font-medium">{task.title}</TableCell>
        <TableCell>
          <Badge variant={task.status === 'done' ? 'success' : 'default'}>
            {task.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Badge Component

**Status indicators**:
```typescript
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

**Custom badge variants**:
```typescript
// In components/ui/badge.tsx
const badgeVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
        // Add custom variants for status
        success: "bg-green-600 text-white",
        warning: "bg-yellow-600 text-white",
        info: "bg-blue-600 text-white",
      }
    }
  }
)
```

---

## Navigation Components

### Tabs Component

**Basic tabs**:
```typescript
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <AccountSettings />
  </TabsContent>
  <TabsContent value="password">
    <PasswordSettings />
  </TabsContent>
</Tabs>
```

---

### Dropdown Menu

**Action menu**:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem className="text-destructive">
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Feedback Components

### Toast (Notifications)

**Setup** (in root layout or provider):
```typescript
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Usage**:
```typescript
import { useToast } from "@/hooks/use-toast"

export function Component() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Task created successfully",
        })
      }}
    >
      Create Task
    </Button>
  )
}
```

**Toast variants**:
```typescript
// Success
toast({
  title: "Success",
  description: "Changes saved",
})

// Error
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong",
})

// With action
toast({
  title: "Task deleted",
  description: "The task has been removed",
  action: <ToastAction altText="Undo">Undo</ToastAction>,
})
```

---

### Skeleton (Loading States)

**Content loading**:
```typescript
import { Skeleton } from "@/components/ui/skeleton"

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Usage with TanStack Query**:
```typescript
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskUseCases.getTasks,
})

if (isLoading) return <TaskListSkeleton />

return <TaskList tasks={tasks} />
```

---

## Composition Patterns

### Compound Components (Recommended)

**Pattern**: Export multiple components that work together

```typescript
// Good example: Card component
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

// Flexible composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

---

### Slot Pattern (asChild)

**Pattern**: Use `asChild` to pass custom trigger elements

```typescript
// ✅ CORRECT: Custom trigger
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost">
      <Icon />
      Custom Trigger
    </Button>
  </DialogTrigger>
  {/* ... */}
</Dialog>

// ❌ WRONG: Default trigger (less control)
<Dialog>
  <DialogTrigger>Click Me</DialogTrigger>
</Dialog>
```

**Why `asChild`?**
- Prevents wrapper div (better HTML structure)
- Merges props correctly
- Preserves event handlers

---

### Controlled vs Uncontrolled

**Uncontrolled** (simple use cases):
```typescript
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>Content</DialogContent>
</Dialog>
```

**Controlled** (when you need to manage state):
```typescript
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>Content</DialogContent>
</Dialog>

// Can programmatically control:
<Button onClick={() => setOpen(true)}>Open from elsewhere</Button>
```

**When to use controlled**:
- Need to close dialog after form submission
- Multiple triggers for same dialog
- Conditional rendering based on open state

---

## Quick Reference

### Essential Components

| Component | Use Case | Key Props |
|-----------|----------|-----------|
| Button | Actions | `variant`, `size`, `disabled` |
| Input | Text entry | `type`, `placeholder`, `disabled` |
| Form | Forms with validation | Uses React Hook Form |
| Dialog | Modals | `open`, `onOpenChange` |
| Card | Content containers | Compound component |
| Badge | Status indicators | `variant` |
| Toast | Notifications | `title`, `description`, `variant` |
| Skeleton | Loading states | `className` for sizing |
| Select | Dropdowns | `onValueChange`, `defaultValue` |
| Table | Data tables | Compound component |

### Accessibility Built-In

✅ **Keyboard navigation** (Tab, Enter, Escape)
✅ **Screen reader support** (ARIA labels)
✅ **Focus management** (auto-focus, focus trap)
✅ **Color contrast** (WCAG AA compliant)
✅ **Touch targets** (44×44px minimum)

### Customization Tips

1. **Modify components directly** (you own the code)
2. **Add variants** using `cva()` in component file
3. **Use Tailwind classes** for styling
4. **Respect semantic tokens** from Style Guide

---

**For latest shadcn/ui patterns, consult**:
- shadcn MCP: `mcp__shadcn__search_items_in_registries`
- Official docs: Context7 `/shadcn/ui`
