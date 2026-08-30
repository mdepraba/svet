# Tailwind CSS Responsive Design Patterns

**Source**: Context7 `/tailwindlabs/tailwindcss.com` + Project experience
**Last Updated**: 2025-01-26

---

## Table of Contents

1. [Mobile-First Approach](#mobile-first-approach)
2. [Breakpoint System](#breakpoint-system)
3. [Responsive Layouts](#responsive-layouts)
4. [Typography & Spacing](#typography--spacing)
5. [Touch Targets](#touch-targets)
6. [Common Patterns](#common-patterns)
7. [Dark Mode](#dark-mode)

---

## Mobile-First Approach

### Philosophy

Tailwind CSS uses a **mobile-first** breakpoint system:
- Base styles apply to mobile (default, no prefix)
- Larger screens use prefixed utilities: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Styles cascade upwards (mobile styles apply to all larger screens unless overridden)

**✅ CORRECT** (mobile-first):
```typescript
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```
- Mobile (0-768px): `text-sm`
- Tablet (768px+): `text-base`
- Desktop (1024px+): `text-lg`

**❌ WRONG** (desktop-first):
```typescript
<div className="text-lg md:text-base sm:text-sm">
  Backwards approach
</div>
```

---

## Breakpoint System

### Standard Breakpoints

| Prefix | Min Width | Device Target | Example |
|--------|-----------|---------------|---------|
| (none) | 0px | Mobile | `text-sm` |
| `sm:` | 640px | Large mobile | `sm:text-base` |
| `md:` | 768px | Tablet | `md:flex-row` |
| `lg:` | 1024px | Desktop | `lg:grid-cols-3` |
| `xl:` | 1280px | Large desktop | `xl:max-w-7xl` |
| `2xl:` | 1536px | Extra large | `2xl:px-0` |

### Common Device Ranges

```typescript
// Mobile-only (0-768px)
<div className="block md:hidden">Mobile menu</div>

// Tablet and up (768px+)
<div className="hidden md:block">Desktop nav</div>

// Desktop-only (1024px+)
<div className="hidden lg:block">Large screen content</div>
```

---

## Responsive Layouts

### Flexbox Patterns

**Mobile stack, Desktop row**:
```typescript
<div className="flex flex-col md:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```
- Mobile: Vertical stack
- Tablet+: Horizontal row

**Responsive alignment**:
```typescript
<div className="flex flex-col items-center md:items-start lg:items-end">
  Content
</div>
```
- Mobile: Center aligned
- Tablet: Left aligned
- Desktop: Right aligned

---

### Grid Patterns

**Responsive columns**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**Auto-fit grid** (responsive without breakpoints):
```typescript
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```
Automatically adjusts columns based on available space.

**Dashboard layout**:
```typescript
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <aside className="lg:col-span-3">Sidebar</aside>
  <main className="lg:col-span-9">Content</main>
</div>
```
- Mobile: Full-width stack
- Desktop: 3/12 sidebar, 9/12 content

---

### Container Patterns

**Responsive max-width**:
```typescript
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>
```
- Mobile: 16px padding
- Small: 24px padding
- Large: 32px padding

**Custom max-widths**:
```typescript
<div className="w-full max-w-sm md:max-w-2xl lg:max-w-5xl mx-auto">
  Centered responsive container
</div>
```

---

## Typography & Spacing

### Responsive Text Sizes

**Heading scale**:
```typescript
<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
  Hero Title
</h1>

<h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
  Section Title
</h2>

<p className="text-sm md:text-base lg:text-lg">
  Body text
</p>
```

### Responsive Spacing

**Padding**:
```typescript
<section className="py-8 md:py-12 lg:py-16">
  <div className="px-4 md:px-6 lg:px-8">
    Content
  </div>
</section>
```

**Margin**:
```typescript
<div className="mb-4 md:mb-6 lg:mb-8">
  Responsive bottom margin
</div>
```

**Gap (Grid/Flex)**:
```typescript
<div className="flex gap-2 md:gap-4 lg:gap-6">
  Items
</div>
```

---

## Touch Targets

### Minimum Size Requirements

**WCAG 2.1 AA**: Minimum 44×44px touch target

**✅ CORRECT**:
```typescript
<Button className="h-11 px-4 md:h-10">
  Touch-friendly
</Button>
```
- Mobile: 44px height (11 × 4px = 44px)
- Desktop: 40px height (can be smaller, mouse is precise)

**Interactive elements**:
```typescript
// Buttons
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon />
</button>

// Links
<a className="inline-block py-3 px-4 text-sm">
  Link text
</a>

// Checkboxes
<input
  type="checkbox"
  className="h-5 w-5"  // 20px = close to 44px with padding
/>
```

### Icon Buttons

**Touch-friendly icons**:
```typescript
<Button variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9">
  <Icon className="h-5 w-5" />
</Button>
```
- Mobile: 44×44px button, 20×20px icon
- Desktop: 36×36px button, 20×20px icon

---

## Common Patterns

### Navigation Bar

**Mobile hamburger, Desktop inline**:
```typescript
<nav className="flex items-center justify-between p-4">
  {/* Logo */}
  <div className="text-xl font-bold">Logo</div>

  {/* Mobile menu button */}
  <Button variant="ghost" className="md:hidden" onClick={toggleMenu}>
    <MenuIcon />
  </Button>

  {/* Desktop nav links */}
  <ul className="hidden md:flex gap-6">
    <li><Link href="/about">About</Link></li>
    <li><Link href="/contact">Contact</Link></li>
  </ul>
</nav>

{/* Mobile menu (full-screen overlay) */}
{isMenuOpen && (
  <div className="fixed inset-0 bg-background z-50 md:hidden">
    <ul className="flex flex-col gap-4 p-8">
      <li><Link href="/about">About</Link></li>
      <li><Link href="/contact">Contact</Link></li>
    </ul>
  </div>
)}
```

---

### Sidebar Layout

**Mobile drawer, Desktop fixed sidebar**:
```typescript
<div className="flex flex-col md:flex-row min-h-screen">
  {/* Mobile: Hamburger + drawer */}
  <Button className="md:hidden" onClick={() => setDrawerOpen(true)}>
    <MenuIcon />
  </Button>

  {/* Sidebar */}
  <aside className={cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r",
    "transition-transform duration-300",
    "md:relative md:translate-x-0",
    drawerOpen ? "translate-x-0" : "-translate-x-full"
  )}>
    Sidebar content
  </aside>

  {/* Main content */}
  <main className="flex-1 p-4 md:p-6 lg:p-8">
    Content
  </main>
</div>
```

---

### Card Grid

**Responsive card layout**:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm md:text-base">{item.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```
- Mobile: 1 column
- Small: 2 columns
- Large: 3 columns
- Extra large: 4 columns

---

### Form Layout

**Mobile stack, Desktop two-column**:
```typescript
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField name="firstName" ... />
    <FormField name="lastName" ... />
  </div>

  <FormField name="email" ... />

  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
    <Button variant="outline" className="w-full sm:w-auto">
      Cancel
    </Button>
    <Button type="submit" className="w-full sm:w-auto">
      Submit
    </Button>
  </div>
</form>
```

---

### Hero Section

**Responsive hero**:
```typescript
<section className="py-12 md:py-24 lg:py-32">
  <div className="container mx-auto px-4">
    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
      {/* Text content */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
          Hero Title
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-6">
          Subtitle text
        </p>
        <Button size="lg" className="w-full sm:w-auto">
          Get Started
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1">
        <img
          src="/hero.png"
          alt="Hero"
          className="w-full h-auto"
        />
      </div>
    </div>
  </div>
</section>
```

---

## Dark Mode

### Setup (Project uses class-based dark mode)

**Applying dark mode styles**:
```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

**Using semantic tokens** (recommended):
```typescript
<div className="bg-background text-foreground">
  Uses CSS variables from Style Guide
</div>
```

### Responsive + Dark Mode

**Combine breakpoints with dark mode**:
```typescript
<div className="
  bg-white dark:bg-gray-900
  text-sm md:text-base
  p-4 md:p-6
  dark:md:p-8
">
  Responsive dark mode
</div>
```
- Mobile light: white bg, text-sm, 16px padding
- Mobile dark: gray-900 bg, text-sm, 16px padding
- Desktop light: white bg, text-base, 24px padding
- Desktop dark: gray-900 bg, text-base, 32px padding

---

## Quick Reference

### Breakpoint Cheat Sheet

```typescript
// Visibility
block md:hidden              // Mobile only
hidden md:block              // Tablet+
hidden lg:block              // Desktop+

// Layout
flex-col md:flex-row         // Mobile stack, tablet row
grid-cols-1 md:grid-cols-2   // 1 col mobile, 2 col tablet

// Sizing
w-full md:w-1/2 lg:w-1/3     // Full mobile, half tablet, third desktop
h-screen md:h-auto           // Full height mobile, auto tablet

// Spacing
p-4 md:p-6 lg:p-8            // 16px mobile, 24px tablet, 32px desktop
gap-2 md:gap-4 lg:gap-6      // 8px mobile, 16px tablet, 24px desktop

// Typography
text-sm md:text-base lg:text-lg  // Responsive text sizes
text-center md:text-left         // Center mobile, left tablet
```

### Design Tokens (From Style Guide)

**⚠️ ALWAYS use semantic tokens, NEVER arbitrary values**

```typescript
// ✅ CORRECT
className="bg-background text-foreground p-spacing-4 rounded-radius-md"

// ❌ WRONG
className="bg-[#FFFFFF] text-[#000000] p-[16px] rounded-[8px]"
```

### Performance Tips

1. **Minimize breakpoint changes** - Use fewer breakpoints when possible
2. **Leverage auto-fit grids** - Reduces need for multiple breakpoints
3. **Use CSS Grid over Flexbox** for complex layouts (better performance)
4. **Avoid layout shifts** - Reserve space for images/async content

---

**For latest Tailwind CSS patterns, consult**:
- Context7: `/tailwindlabs/tailwindcss.com`
- Style Guide: `.claude/STYLE_GUIDE.md`
