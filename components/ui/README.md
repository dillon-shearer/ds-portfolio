# UI Primitives

Seven primitives. No others without updating `STYLE.md` first.

| Name       | File           | Variants                   | Use when                     | Never use for                |
| ---------- | -------------- | -------------------------- | ---------------------------- | ---------------------------- |
| Badge      | Badge.tsx      | -                          | Skill tags (max 3 per card)  | Status indicators with color |
| Button     | Button.tsx     | primary, outline, ghost    | CTAs and form submits        | Navigation                   |
| InlineLink | Link.tsx       | -                          | Body text links              | Buttons                      |
| NavLink    | Link.tsx       | -                          | Header/footer nav only       | Body links                   |
| Card       | Card.tsx       | -                          | Certs, resumes, capabilities | Cards within cards           |
| Input      | Input.tsx      | input (default), textarea  | Contact form fields          | Search, dropdowns            |
| PageHeader | PageHeader.tsx | -                          | Top of every page            | Mid-page headings            |

## Import

```tsx
import { Button, Card } from '@/components/ui'
```
