# WCAG 2.1 AA Accessibility Compliance Checklist

**Source**: W3C WCAG 2.1 Guidelines + Project requirements
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Color Contrast](#color-contrast)
2. [Keyboard Navigation](#keyboard-navigation)
3. [ARIA Labels & Roles](#aria-labels--roles)
4. [Focus Management](#focus-management)
5. [Screen Reader Support](#screen-reader-support)
6. [Forms & Validation](#forms--validation)
7. [Touch Targets](#touch-targets)
8. [Semantic HTML](#semantic-html)
9. [Testing Tools](#testing-tools)

---

## Color Contrast

### Requirements (WCAG 2.1 AA)

**Text contrast ratios**:
- **Normal text** (< 24px or < 19px bold): **4.5:1** minimum
- **Large text** (≥ 24px or ≥ 19px bold): **3:1** minimum
- **UI components** (buttons, borders, focus indicators): **3:1** minimum

### Checking Contrast

**✅ CORRECT** (using semantic tokens from Style Guide):
```typescript
<p className="text-foreground bg-background">
  Guaranteed WCAG AA contrast
</p>
```
Style Guide tokens are pre-validated for contrast.

**❌ WRONG** (arbitrary colors, no guarantee):
```typescript
<p className="text-[#888888] bg-[#FFFFFF]">
  Unknown contrast ratio
</p>
```

### Common Patterns

**Interactive elements**:
```typescript
// Button with sufficient contrast
<Button className="bg-primary text-primary-foreground">
  Click Me
</Button>

// Link with underline (for users who can't see color)
<a href="/about" className="text-primary underline hover:no-underline">
  About Us
</a>
```

**Error states**:
```typescript
// ✅ CORRECT: Icon + color + text
<div className="flex items-center gap-2 text-destructive">
  <AlertCircle className="h-4 w-4" />
  <span>Error: Invalid email</span>
</div>

// ❌ WRONG: Color only (colorblind users can't distinguish)
<span className="text-red-500">Error</span>
```

---

## Keyboard Navigation

### Tab Order

**All interactive elements** must be keyboard accessible:
- `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`
- Custom interactive elements must have `tabIndex={0}`

**✅ CORRECT** (native button, keyboard accessible):
```typescript
<button onClick={handleClick}>Click Me</button>
```

**❌ WRONG** (div is not keyboard accessible):
```typescript
<div onClick={handleClick}>Click Me</div>
```

**Fix** (add keyboard support to div):
```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click Me
</div>
```

**Better** (use native button):
```typescript
<Button onClick={handleClick}>Click Me</Button>
```

---

### Keyboard Shortcuts

**Essential shortcuts**:
- **Tab**: Move forward through interactive elements
- **Shift + Tab**: Move backward
- **Enter**: Activate buttons/links
- **Space**: Activate buttons, toggle checkboxes
- **Escape**: Close dialogs/modals
- **Arrow keys**: Navigate menus, tabs, radio groups

**Dialog example** (Escape to close):
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* shadcn Dialog handles Escape automatically */}
    Content
  </DialogContent>
</Dialog>
```

**Custom shortcuts** (document in UI):
```typescript
<div>
  <kbd className="px-2 py-1 bg-muted rounded text-sm">
    Ctrl + K
  </kbd>
  <span className="ml-2">Open search</span>
</div>
```

---

### Skip Links

**Allow keyboard users to skip navigation**:
```typescript
<a
  href="#main-content"
  className="
    sr-only focus:not-sr-only
    focus:absolute focus:top-4 focus:left-4
    focus:z-50 focus:px-4 focus:py-2
    focus:bg-primary focus:text-primary-foreground
  "
>
  Skip to main content
</a>

<nav>...</nav>

<main id="main-content">
  Content
</main>
```

---

## ARIA Labels & Roles

### When to Use ARIA

**Rule**: Use native HTML first, ARIA only when needed.

```typescript
// ✅ CORRECT: Native button (no ARIA needed)
<button>Save</button>

// ❌ WRONG: Unnecessary ARIA
<button role="button" aria-label="Save">Save</button>

// ✅ CORRECT: ARIA when text is missing
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

---

### Common ARIA Patterns

**Icon-only buttons**:
```typescript
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-5 w-5" />
</Button>
```

**Decorative images** (screen readers should ignore):
```typescript
<img src="/decoration.png" alt="" role="presentation" />
```

**Informative images**:
```typescript
<img src="/chart.png" alt="Sales increased 25% in Q4" />
```

**Loading states**:
```typescript
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Spinner aria-label="Loading tasks" /> : <TaskList />}
</div>
```

**Error messages** (announce to screen readers):
```typescript
<div role="alert" aria-live="assertive">
  {error && <p>{error.message}</p>}
</div>
```

---

### Form Fields

**Always associate labels**:
```typescript
// ✅ CORRECT: Label linked via htmlFor
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ WRONG: No association
<Label>Email</Label>
<Input type="email" />
```

**Required fields**:
```typescript
<Label htmlFor="email">
  Email <span className="text-destructive">*</span>
</Label>
<Input id="email" type="email" required aria-required="true" />
```

**Error messages**:
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          aria-invalid={!!fieldState.error}
          aria-describedby={fieldState.error ? "email-error" : undefined}
        />
      </FormControl>
      {fieldState.error && (
        <FormMessage id="email-error" role="alert">
          {fieldState.error.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>
```
shadcn `<FormMessage>` handles this automatically.

---

## Focus Management

### Visible Focus Indicators

**WCAG 2.1 AA**: Focus indicators must be visible with **3:1 contrast**.

**✅ CORRECT** (shadcn/ui components have built-in focus styles):
```typescript
<Button>Click Me</Button>
// Automatically gets focus:ring-2 focus:ring-offset-2
```

**Custom focus styles**:
```typescript
<a
  href="/about"
  className="
    rounded-md
    focus:outline-none
    focus:ring-2 focus:ring-primary focus:ring-offset-2
  "
>
  About
</a>
```

**❌ WRONG** (removes focus indicator):
```typescript
<button className="focus:outline-none">
  No focus indicator
</button>
```

---

### Focus Trapping (Modals)

**Dialogs must trap focus** (prevents tabbing outside):
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus automatically trapped inside dialog */}
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
shadcn `<Dialog>` handles focus trapping automatically.

---

### Auto-focus on Open

**Set initial focus**:
```typescript
import { useEffect, useRef } from 'react'

export function SearchDialog({ open }: { open: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  return (
    <Dialog open={open}>
      <DialogContent>
        <Input ref={inputRef} placeholder="Search..." />
      </DialogContent>
    </Dialog>
  )
}
```

---

## Screen Reader Support

### Semantic Landmarks

**Use semantic HTML** for screen reader navigation:

```typescript
<header>
  <nav aria-label="Main navigation">
    <ul>...</ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content</p>
  </article>

  <aside aria-label="Related articles">
    <h2>Related</h2>
    <ul>...</ul>
  </aside>
</main>

<footer>
  <p>© 2025 Company</p>
</footer>
```

**ARIA landmarks** (when semantic HTML is not possible):
```typescript
<div role="navigation" aria-label="Breadcrumbs">
  <ol>...</ol>
</div>

<div role="main">
  Content
</div>
```

---

### Live Regions

**Announce dynamic updates**:
```typescript
// Polite announcements (e.g., success messages)
<div role="status" aria-live="polite">
  {successMessage}
</div>

// Urgent announcements (e.g., errors)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**Toast notifications**:
```typescript
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Success",
  description: "Task created successfully",
})
// shadcn Toast automatically announces to screen readers
```

---

### Descriptive Links

**❌ WRONG** (ambiguous):
```typescript
<a href="/about">Click here</a>
```

**✅ CORRECT** (descriptive):
```typescript
<a href="/about">Learn more about our company</a>
```

**Link with context**:
```typescript
<Card>
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Project description...</p>
  </CardContent>
  <CardFooter>
    <a href="/projects/alpha" aria-label="View Project Alpha details">
      View Details
    </a>
  </CardFooter>
</Card>
```

---

## Forms & Validation

### Field Instructions

**Provide help text**:
```typescript
<FormField
  control={form.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
        <Input type="password" {...field} />
      </FormControl>
      <FormDescription>
        Must be at least 8 characters with 1 uppercase and 1 number
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Error Handling

**✅ CORRECT** (accessible errors):
```typescript
<FormMessage role="alert">
  {error.message}
</FormMessage>
```

**Focus on first error**:
```typescript
const onSubmit = async (data: FormData) => {
  try {
    await submitForm(data)
  } catch (error) {
    const firstError = Object.keys(form.formState.errors)[0]
    form.setFocus(firstError as any)
  }
}
```

---

## Touch Targets

### Minimum Size (WCAG 2.1 AA)

**Touch targets must be at least 44×44px**:

```typescript
// ✅ CORRECT: 44px height on mobile
<Button className="h-11 md:h-10">
  Touch-friendly
</Button>

// ✅ CORRECT: Icon button with padding
<Button variant="ghost" size="icon" className="h-11 w-11">
  <Icon className="h-5 w-5" />
</Button>

// ❌ WRONG: Too small (32px)
<button className="h-8 w-8">
  <Icon />
</button>
```

---

### Spacing Between Targets

**Targets should have adequate spacing** (8px minimum):

```typescript
<div className="flex gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

---

## Semantic HTML

### Headings Hierarchy

**✅ CORRECT** (proper hierarchy):
```typescript
<h1>Page Title</h1>
<h2>Section 1</h2>
<h3>Subsection 1.1</h3>
<h3>Subsection 1.2</h3>
<h2>Section 2</h2>
```

**❌ WRONG** (skipping levels):
```typescript
<h1>Page Title</h1>
<h3>Section 1</h3>  {/* Skipped h2 */}
```

---

### Lists

**Use semantic lists**:
```typescript
// Navigation
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// Ordered steps
<ol>
  <li>Step 1</li>
  <li>Step 2</li>
  <li>Step 3</li>
</ol>
```

---

### Buttons vs Links

**Button**: Performs an action (submit, open modal, toggle)
```typescript
<Button onClick={handleSave}>Save</Button>
<Button onClick={() => setOpen(true)}>Open Dialog</Button>
```

**Link**: Navigates to a different page/section
```typescript
<Link href="/about">About Us</Link>
<a href="#section">Jump to section</a>
```

**❌ WRONG** (link that performs action):
```typescript
<a href="#" onClick={handleSave}>Save</a>
```

---

## Testing Tools

### Manual Testing

**Keyboard-only testing**:
1. Unplug mouse
2. Navigate entire app using only Tab, Enter, Escape, Arrow keys
3. Verify all functionality is accessible

**Screen reader testing**:
- **Windows**: NVDA (free)
- **Mac**: VoiceOver (built-in, Cmd+F5)
- **Chrome**: ChromeVox extension

---

### Automated Testing

**Chrome DevTools MCP** (during validation phase):
```typescript
// Capture accessibility audit
mcp__chrome_devtools__evaluate_script({
  script: `
    const { accessibility } = await import('https://unpkg.com/playwright');
    const snapshot = await accessibility.snapshot();
    JSON.stringify(snapshot, null, 2);
  `
})
```

**Lighthouse audit**:
```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

**Playwright E2E tests**:
```typescript
test('button is keyboard accessible', async ({ page }) => {
  await page.goto('/tasks')
  await page.keyboard.press('Tab')  // Focus button
  await page.keyboard.press('Enter')  // Activate button
  await expect(page.locator('[role="dialog"]')).toBeVisible()
})
```

---

## Quick Checklist

Before marking UI implementation as complete, verify:

- [ ] **Color contrast** ≥ 4.5:1 for text, ≥ 3:1 for UI components
- [ ] **Keyboard navigation** works for all interactive elements
- [ ] **Focus indicators** visible on all focusable elements
- [ ] **ARIA labels** on icon-only buttons and complex widgets
- [ ] **Form labels** properly associated with inputs
- [ ] **Error messages** announced to screen readers (`role="alert"`)
- [ ] **Touch targets** ≥ 44×44px on mobile
- [ ] **Semantic HTML** (headings, landmarks, lists, buttons vs links)
- [ ] **Responsive design** tested at all breakpoints
- [ ] **Screen reader** announces page structure correctly
- [ ] **Skip links** available for keyboard users
- [ ] **Live regions** announce dynamic updates
- [ ] **Focus management** in modals (trap, auto-focus, restore)
- [ ] **Alt text** on informative images, `alt=""` on decorative
- [ ] **No color-only indicators** (use icons + text)

---

**For latest WCAG guidelines, consult**:
- W3C WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Chrome DevTools MCP: Visual and programmatic audits
