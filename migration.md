
**Three layering rules:**

1. **`lib/` never imports React.** Plain TS: fetch wrapper, config,
   formatters. Runnable in a Node script.
2. **`components/` never imports from `features/`.** Navbar doesn't know
   what a demo screen is. Shared components receive data as props.
3. **`features/` import one direction only.** `youtube` may import `lib/`
   and `components/`. `marketing` may import `lib/` and `components/`.
   No `features/` imports another `features/`. Shared code moves up.

---

## 5. Design tokens

Canonical source: `src/styles/tokens.css`. 16 tokens consumed across the
codebase. Tailwind v4 mirrors them in `src/styles/theme.css` under `@theme`:

| Category | Token | Value |
|---|---|---|
| Surfaces | `canvas` | `#f7f8fa` |
| | `surface` | `#ffffff` |
| | `surface-subtle` | `#fbfcfd` |
| Ink | `ink` | `#14161a` |
| | `ink-soft` | `#3f4854` |
| | `ink-muted` | `#6f7885` |
| | `ink-dim` | `#939ba6` |
| Accent | `accent` | `#16abc5` |
| | `accent-strong` | `#078da7` |
| | `accent-hover` | `#22d3ee` |
| | `accent-soft` | `rgba(22, 171, 197, 0.09)` |
| Lines | `line` | `rgba(20, 22, 26, 0.08)` |
| | `line-strong` | `rgba(20, 22, 26, 0.14)` |
| Status | `success` | `#16845f` |
| | `warning` | `#a66a12` |
| | `danger` | `#c43a46` |

Plus: radius (`td`, `td-sm`), shadows (`td`, `td-hover`, `focus`),
fonts (`display`, `body`, `mono`), motion (`ease-premium`).

After Tailwind loads, both syntaxes work:
```jsx
<div className="bg-surface text-ink-muted rounded-td">   // Tailwind
<div style={{ background: 'var(--surface)' }}>           // legacy