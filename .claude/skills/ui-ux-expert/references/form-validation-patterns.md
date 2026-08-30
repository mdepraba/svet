# React Hook Form + Zod Integration Patterns

**Source**: Context7 `/react-hook-form/react-hook-form` + Project patterns
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Setup & Integration](#setup--integration)
2. [Basic Form Pattern](#basic-form-pattern)
3. [Validation Rules](#validation-rules)
4. [Error Handling](#error-handling)
5. [Multi-Step Forms](#multi-step-forms)
6. [Conditional Fields](#conditional-fields)
7. [File Uploads](#file-uploads)
8. [Form Submission](#form-submission)

---

## Setup & Integration

### Required Dependencies (Already Installed)

```bash
npm install react-hook-form @hookform/resolvers zod
```

---

### Basic Integration with shadcn Form

**Complete example**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// 1. Define Zod schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
})

// 2. Infer TypeScript type from schema
type FormData = z.infer<typeof formSchema>

export function CreateTaskForm() {
  // 3. Initialize form with Zod resolver
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  // 4. Submit handler
  function onSubmit(data: FormData) {
    console.log(data)  // { title: '...', description: '...' }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormDescription>
                A brief title for your task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Basic Form Pattern

### Text Input

```typescript
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
})

<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" placeholder="you@example.com" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Textarea

```typescript
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
})

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea placeholder="Describe the task..." {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Select/Dropdown

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  status: z.enum(['todo', 'in-progress', 'done']),
})

<FormField
  control={form.control}
  name="status"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Status</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Checkbox

```typescript
import { Checkbox } from '@/components/ui/checkbox'

const formSchema = z.object({
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

<FormField
  control={form.control}
  name="terms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>
          Accept terms and conditions
        </FormLabel>
        <FormDescription>
          You agree to our Terms of Service and Privacy Policy
        </FormDescription>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Radio Group

```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const formSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
})

<FormField
  control={form.control}
  name="priority"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Priority</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex flex-col space-y-1"
        >
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="low" />
            </FormControl>
            <FormLabel className="font-normal">
              Low
            </FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="medium" />
            </FormControl>
            <FormLabel className="font-normal">
              Medium
            </FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="high" />
            </FormControl>
            <FormLabel className="font-normal">
              High
            </FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Validation Rules

### String Validations

```typescript
const schema = z.object({
  // Required string
  name: z.string().min(1, 'Name is required'),

  // Min/max length
  username: z.string().min(3).max(20),

  // Email
  email: z.string().email('Invalid email address'),

  // URL
  website: z.string().url('Invalid URL'),

  // Regex
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),

  // Custom validation
  password: z.string().refine(
    (val) => val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val),
    {
      message: 'Password must be 8+ characters with 1 uppercase and 1 number',
    }
  ),
})
```

---

### Number Validations

```typescript
const schema = z.object({
  // Required number
  age: z.number().min(18, 'Must be 18 or older'),

  // Range
  rating: z.number().min(1).max(5),

  // Integer only
  quantity: z.number().int('Must be a whole number'),

  // Positive
  price: z.number().positive('Price must be positive'),

  // String to number (form inputs)
  amount: z.coerce.number().positive(),
})
```

---

### Date Validations

```typescript
const schema = z.object({
  // Date required
  dueDate: z.date({
    required_error: 'Due date is required',
  }),

  // Future date only
  scheduledDate: z.date().refine(
    (date) => date > new Date(),
    { message: 'Date must be in the future' }
  ),

  // Date range
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})
```

---

### Array Validations

```typescript
const schema = z.object({
  // Array of strings
  tags: z.array(z.string()).min(1, 'At least one tag required'),

  // Array of objects
  members: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['admin', 'member']),
    })
  ).min(1),

  // Optional array
  attachments: z.array(z.string()).optional(),
})
```

---

### Object Validations

```typescript
const schema = z.object({
  // Nested object
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().regex(/^\d{5}$/),
  }),

  // Optional object
  metadata: z.object({
    source: z.string(),
  }).optional(),
})
```

---

## Error Handling

### Display Field Errors

**Automatic** (using `<FormMessage>`):
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />  {/* Automatically displays error */}
    </FormItem>
  )}
/>
```

---

### Manual Error Display

```typescript
const { formState: { errors } } = form

{errors.email && (
  <p className="text-sm text-destructive">{errors.email.message}</p>
)}
```

---

### Set Errors Programmatically

```typescript
async function onSubmit(data: FormData) {
  try {
    await taskUseCases.createTask(data)
  } catch (error) {
    if (error.code === 'DUPLICATE_TITLE') {
      form.setError('title', {
        type: 'manual',
        message: 'A task with this title already exists',
      })
    } else {
      form.setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred',
      })
    }
  }
}

// Display root error
{form.formState.errors.root && (
  <div className="rounded-md bg-destructive/15 p-3">
    <p className="text-sm text-destructive">
      {form.formState.errors.root.message}
    </p>
  </div>
)}
```

---

### Clear Errors

```typescript
// Clear specific field
form.clearErrors('email')

// Clear all errors
form.clearErrors()
```

---

## Multi-Step Forms

### Wizard Pattern

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const step1Schema = z.object({
  title: z.string().min(1),
  description: z.string(),
})

const step2Schema = z.object({
  dueDate: z.date(),
  priority: z.enum(['low', 'medium', 'high']),
})

const fullSchema = step1Schema.merge(step2Schema)

type FormData = z.infer<typeof fullSchema>

export function MultiStepForm() {
  const [step, setStep] = useState(1)

  const form = useForm<FormData>({
    resolver: zodResolver(step === 1 ? step1Schema : fullSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  })

  async function onSubmit(data: FormData) {
    if (step === 1) {
      // Validate step 1
      const isValid = await form.trigger(['title', 'description'])
      if (isValid) {
        setStep(2)
      }
    } else {
      // Submit full form
      console.log(data)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <h2>Step 1: Basic Info</h2>
            <FormField control={form.control} name="title" {...} />
            <FormField control={form.control} name="description" {...} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2>Step 2: Details</h2>
            <FormField control={form.control} name="dueDate" {...} />
            <FormField control={form.control} name="priority" {...} />
          </div>
        )}

        <div className="flex gap-3 justify-between mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button type="submit">
            {step === 1 ? 'Next' : 'Submit'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## Conditional Fields

### Show/Hide Fields Based on Values

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
})

const taskType = form.watch('taskType')  // Watch for changes

return (
  <form>
    <FormField
      control={form.control}
      name="taskType"
      render={({ field }) => (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectItem value="simple">Simple</SelectItem>
          <SelectItem value="complex">Complex</SelectItem>
        </Select>
      )}
    />

    {/* Only show if taskType is 'complex' */}
    {taskType === 'complex' && (
      <FormField
        control={form.control}
        name="subtasks"
        render={({ field }) => (
          <Textarea placeholder="Enter subtasks..." {...field} />
        )}
      />
    )}
  </form>
)
```

---

### Conditional Validation

```typescript
const schema = z.object({
  taskType: z.enum(['simple', 'complex']),
  subtasks: z.string().optional(),
}).refine(
  (data) => {
    if (data.taskType === 'complex') {
      return !!data.subtasks && data.subtasks.length > 0
    }
    return true
  },
  {
    message: 'Subtasks are required for complex tasks',
    path: ['subtasks'],
  }
)
```

---

## File Uploads

### File Input Pattern

```typescript
const schema = z.object({
  avatar: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    { message: 'File must be less than 5MB' }
  ).refine(
    (file) => ['image/jpeg', 'image/png'].includes(file.type),
    { message: 'Only JPEG and PNG files are allowed' }
  ),
})

<FormField
  control={form.control}
  name="avatar"
  render={({ field: { value, onChange, ...field } }) => (
    <FormItem>
      <FormLabel>Avatar</FormLabel>
      <FormControl>
        <Input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onChange(file)
          }}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Form Submission

### With TanStack Query Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskUseCases } from '@/features/tasks/use-cases'
import { useToast } from '@/hooks/use-toast'

export function CreateTaskForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const createMutation = useMutation({
    mutationFn: taskUseCases.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: 'Success', description: 'Task created' })
      form.reset()  // Clear form
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

  function onSubmit(data: FormData) {
    createMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Fields */}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### Reset Form After Submission

```typescript
onSuccess: () => {
  form.reset()  // Reset to default values
}
```

---

### Set Values Programmatically

```typescript
// Set single value
form.setValue('title', 'New Title')

// Set multiple values
form.reset({
  title: 'New Title',
  description: 'New Description',
})
```

---

## Quick Reference

### Form Setup Pattern
```typescript
const schema = z.object({ /* fields */ })
type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* defaults */ },
})
```

### Field Pattern
```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Submit Pattern
```typescript
<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* fields */}
  <Button type="submit" disabled={form.formState.isSubmitting}>
    Submit
  </Button>
</form>
```

---

**For latest React Hook Form patterns, consult**:
- Context7: `/react-hook-form/react-hook-form` - "zodResolver validation"
- Official docs: https://react-hook-form.com/
