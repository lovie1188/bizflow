# BizFlow — Design System & UI Guidelines
> Version: 2.0 | Last Updated: November 2026

---

## 1. Design Philosophy

**"Premium & Tight"** — The core design philosophy for all UI.

- **Premium**: Subtle shadows, clean typography, restrained colors, clear hierarchy
- **Tight**: Minimal unnecessary whitespace, useful information density
- **Never**: Visual clutter, excessive decoration, default-looking UI, generic templates

---

## 2. Typography

### Font Family
**Manrope** — Self-hosted WOFF2 in `/frontend/public/fonts/`

```css
font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights Available
- `manrope-regular.woff2` → 400
- `manrope-medium.woff2` → 500
- `manrope-semibold.woff2` → 600
- `manrope-bold.woff2` → 700
- `manrope-extrabold.woff2` → 800

### Type Scale
```css
html { font-size: 14px; }  /* Base is 14px, not 16px */

h1 { font-size: 1.9rem; }
h2 { font-size: 1.45rem; }
h3 { font-size: 1.15rem; }
h4 { font-size: 1rem; }
p  { font-size: 0.9rem; line-height: 1.65; }
```

### Heading Style
```css
letter-spacing: -0.02em;  /* Tight tracking on all headings */
line-height: 1.25;
font-weight: 700;
```

---

## 3. Color System (CSS Variables)

All colors are defined as CSS custom properties in `frontend/src/index.css`.

### Brand Colors
```css
--color-brand:        #02B290;   /* Primary teal/green — BoroBazar inspired */
--color-brand-dark:   #017A63;   /* Hover/active state */
--color-brand-light:  #E6F7F4;   /* Light background tint */
--color-primary:      #02B290;
--color-secondary:    #F59E0B;   /* Amber — secondary actions */
--color-accent:       #6366F1;   /* Indigo — accent/badges */
--color-danger:       #EF4444;   /* Red — errors, destructive */
--color-success:      #10B981;   /* Green — success states */
--color-warning:      #F59E0B;   /* Amber — warnings */
--color-orange:       #F97316;   /* Orange — highlights */
```

### Backgrounds
```css
--bg-app:        #FAFAF8;   /* Warm off-white — main app background */
--bg-white:      #FFFFFF;
--bg-alt:        #F3F6F4;   /* Slightly green-tinted alt background */
--bg-card:       #FFFFFF;
--bg-card-hover: #F8FFFE;   /* Subtle hover on cards */
--bg-input:      #FFFFFF;
--bg-hover:      #F3F6F4;
--bg-dark:       #1A2332;   /* Admin sidebar */
```

### Text
```css
--text-main:    #212529;   /* Primary text */
--text-muted:   #6B7280;   /* Secondary/helper text */
--text-light:   #9CA3AF;   /* Placeholder/disabled */
--text-white:   #FFFFFF;
```

### Borders
```css
--border-base:         #E5E7EB;
--border-light:        #F0F2F0;
--glass-border-active: rgba(2, 178, 144, 0.4);  /* Brand-tinted active border */
```

---

## 4. Spacing Scale

```css
--sp-1: 4px;
--sp-2: 8px;
--sp-3: 12px;
--sp-4: 16px;
--sp-5: 20px;
--sp-6: 24px;
--sp-8: 32px;
```

---

## 5. Border Radius Scale

```css
--radius-xs:   4px;
--radius-sm:   8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-xl:   24px;
--radius-full: 999px;  /* Pills, avatars */
```

---

## 6. Shadow System

Very subtle — intentionally light for the clean aesthetic:

```css
--shadow-xs:    0 1px 3px rgba(0,0,0,0.06);
--shadow-sm:    0 2px 8px rgba(0,0,0,0.08);
--shadow-md:    0 4px 16px rgba(0,0,0,0.10);
--shadow-lg:    0 8px 30px rgba(0,0,0,0.12);
--shadow-brand: 0 4px 16px rgba(2,178,144,0.25);  /* Brand glow */
```

---

## 7. Animation / Transitions

```css
--transition:      all 0.22s cubic-bezier(0.16, 1, 0.3, 1);  /* Snappy ease-out */
--transition-slow: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 8. Component Patterns

### Glass Panel (Primary Card)
```css
.glass-panel {
  background: var(--bg-white);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```
Used for: forms, settings sections, product cards, dashboard stat boxes.

### Buttons
```css
.btn-primary     /* Brand green, white text */
.btn-secondary   /* Outlined, brand border */
.btn-danger      /* Red, destructive actions */
```

Buttons always use `display: flex; align-items: center; gap: 6px` for icon+text alignment.

### Form Inputs
```css
.form-input         /* Base input styling */
.form-input-icon    /* Wrapper for input with left icon */
```

Pattern for inputs with icons:
```jsx
<div className="form-input-icon">
  <IconComponent size={15} className="icon" />
  <input type="text" className="form-input" />
</div>
```

### Toast Notifications
Global system via `ToastContext`. **Never use `alert()` or `confirm()`**.
```jsx
const { showToast } = useToast();
showToast('Message', 'success'); // 'success' | 'error' | 'warning' | 'info'
```

---

## 9. Layout Layouts

### Admin Layout (Supplier Dashboard)
- Sidebar: `240px` wide, `#1A2332` dark background
- Content area: fills remaining width
- Mobile: sidebar collapses to bottom nav / hamburger

### Shop Layout (Buyer + Public)
- Top navigation bar
- Context-aware: fetches tenant name from API for `/store/:storeName`
- Logo shows: tenant company name on store pages, "BizFlow" on login/landing

### Platform Pages (PlatformLanding, Marketplace)
- Standalone — have their own nav, no ShopLayout wrapper
- Max-width: 1280px centered
- Mobile-first responsive

---

## 10. Responsive Design Rules

- **Mobile-first** always
- Touch targets minimum `44px` height
- Tables must remain usable on mobile (horizontal scroll or card layout)
- Forms practical on mobile (stacked, full-width inputs)
- Desktop enhancements must not break mobile behavior
- No fixed-width assumptions

---

## 11. What NOT to Do

| ❌ Avoid | ✅ Do instead |
|---------|-------------|
| `alert()` / `confirm()` | Toast notifications / inline confirm UI |
| External CDN fonts/icons | Self-hosted Manrope; lucide-react icons (bundled) |
| Tailwind utility classes | CSS variables + semantic class names |
| Generic Bootstrap look | Custom components with design tokens |
| Large padding/margins | Tight spacing, density-first |
| Generic placeholder images | Real product images or brand-consistent placeholders |
| Hardcoded colors | Always use `var(--color-brand)` etc. |

---

## 12. Icon Library

**lucide-react** — imported per icon (tree-shakeable):
```jsx
import { Building2, Mail, ArrowRight } from 'lucide-react';
```

Standard icon sizes:
- `14-15px` — inline in text, form inputs
- `16-18px` — buttons
- `20-24px` — card headers
- `26-32px` — section icons / empty states
