# UI Primitives

The public primitive inventory is exported from `components/ui/index.ts`.
Update this table and `.claude/STYLE.md` when adding an export.

| Export | File | Use when | Do not use for |
| --- | --- | --- | --- |
| `Badge` | `Badge.tsx` | Short tags, up to three per card | Color-coded status |
| `Button` | `Button.tsx` | CTAs, form submits, and actions | Navigation that should use `NavLink` |
| `InlineLink` | `Link.tsx` | Body-text links | Buttons |
| `NavLink` | `Link.tsx` | Header, footer, and mobile navigation | Body-text links |
| `Card` | `Card.tsx` | Certifications, resumes, and capabilities | Nested cards or index lists |
| `Input` | `Input.tsx` | Contact-form fields and textareas | Search or select controls |
| `PageHeader` | `PageHeader.tsx` | Top of a page | Mid-page headings |
| `DashboardCard` | `DashboardCard.tsx` | Numbered dashboard index rows | General card layouts |

## Import

```tsx
import { Button, Card } from '@/components/ui'
```
