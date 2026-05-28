# UI Primitives

Eight primitives. No others without updating `STYLE.md` first.

| Name | File | Variants | Use when | Never use for |
|---|---|---|---|---|
| Rule | Rule.tsx | hairline (default), medium | Section dividers | Decorative |
| Badge | Badge.tsx | — | Skill tags (max 3 per card) | Status indicators with color |
| Button | Button.tsx | primary, outline, ghost | CTAs and form submits | Navigation |
| InlineLink | Link.tsx | — | Body text links | Buttons |
| NavLink | Link.tsx | — | Header/footer nav only | Body links |
| Card | Card.tsx | — | Certs, resumes, capabilities | Cards within cards |
| Input | Input.tsx | input (default), textarea | Contact form fields | Search, dropdowns |
| PageHeader | PageHeader.tsx | — | Top of every page | Mid-page headings |
| Table | Table.tsx | — | Tabular data | Layout grids |
| CodeBlock | CodeBlock.tsx | — | Code samples | Long prose |

## Import

```tsx
import { Button, Card, Rule } from '@/components/ui'
```
