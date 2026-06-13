# Design System: Taller de Electrónica - Armada RD

## Identity

The system is a professional, institutional inventory and work-order management tool for a military electronics workshop. The visual language prioritizes clarity, trust, and efficiency over decoration. It should feel like serious software for serious work: dense where it helps, sparse where it distracts, and always legible under the varied lighting of a workshop or office.

**Memorable thing:** "I always know what needs my attention — alerts, overdue loans, and low stock are impossible to miss, and everything else stays out of the way."

## Color Palette

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-900` | `#0f172a` | Primary text, headers |
| `brand-800` | `#1e3a5f` | Naval institutional primary — sidebar, primary buttons |
| `brand-700` | `#1d4ed8` | Active navigation, links |
| `brand-100` | `#dbeafe` | Subtle brand backgrounds |
| `brand-50` | `#eff6ff` | Hover rows, soft highlights |

### Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-900` | `#111827` | Headings, primary text |
| `gray-700` | `#374151` | Body text |
| `gray-500` | `#6b7280` | Secondary text, placeholders |
| `gray-300` | `#d1d5db` | Borders, dividers |
| `gray-100` | `#f3f4f6` | Section backgrounds |
| `gray-50` | `#f9fafb` | Page background |
| `white` | `#ffffff` | Cards, dialogs, input backgrounds |

### Semantics

| Token | Hex | Usage |
|-------|-----|-------|
| `success-500` | `#16a34a` | Available, completed, returned |
| `warning-500` | `#f59e0b` | Pending, waiting parts, in repair |
| `critical-500` | `#dc2626` | Critical stock, overdue tools, blocked |
| `info-500` | `#3b82f6` | Informational highlights, links |

### Status Colors

Use these consistently for badges, alerts, and state indicators:

- **Disponible / Recibido / Devuelto** → `success-500`
- **En diagnóstico / En reparación / Prestada** → `warning-500`
- **Esperando repuesto** → `info-500`
- **Reparado** → `success-500`
- **Entregado / Descargada** → `gray-500`
- **Crítico / Bajo stock / Vencido** → `critical-500`

## Typography

### Font Families

- **UI**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Data / serials / SKUs**: `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace`

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 0.75rem (12px) | 1rem | 400 | Captions, table metadata, timestamps |
| `text-sm` | 0.875rem (14px) | 1.25rem | 400 | Body secondary, form labels, buttons |
| `text-base` | 1rem (16px) | 1.5rem | 400 | Body text |
| `text-lg` | 1.125rem (18px) | 1.75rem | 500 | Card titles, section headers |
| `text-xl` | 1.25rem (20px) | 1.75rem | 600 | Page titles |
| `text-2xl` | 1.5rem (24px) | 2rem | 700 | Dashboard headings |
| `text-3xl` | 1.875rem (30px) | 2.25rem | 700 | Top-level page headings |

### Typography Rules

- Use `font-mono` for SKUs, part numbers, serial numbers, OT numbers, and document numbers.
- Keep labels short and action-oriented: "Registrar entrada", "Aprobar salida", "Cerrar OT".
- Avoid all-caps except for true abbreviations (SKU, OT, IP).

## Spacing

### Base Unit

Base spacing unit is `0.25rem` (4px). Use Tailwind's default scale.

### Common Patterns

| Context | Value |
|---------|-------|
| Page padding | `p-6` (24px) |
| Card padding | `p-4` (16px) |
| Card gap | `gap-4` (16px) |
| Form field gap | `gap-4` (16px) |
| Table cell padding | `px-4 py-3` |
| Section gap | `gap-6` (24px) |
| Sidebar item padding | `px-4 py-3` |

## Layout

### Desktop (≥1024px)

- Fixed left sidebar, `w-64` (256px), `bg-brand-800`, white text.
- Main content area fills remaining width, `bg-gray-50`.
- Top bar inside main area: page title, global search, user menu, alert bell.
- Max content width `max-w-7xl` for forms; tables use full width.

### Tablet (768px–1023px)

- Sidebar collapses to a narrow rail `w-16` with icons only.
- Tap to expand rail to full sidebar.
- Cards stack in 2 columns.

### Mobile (<768px)

- Bottom navigation or hamburger menu (secondary priority; system targets desktop/tablet).
- Single-column layout.
- Tables become horizontally scrollable.

## Components

### Sidebar Navigation

- Background: `bg-brand-800`
- Active item: `bg-brand-700` with left `4px` accent bar
- Inactive item: `text-white/80`, hover `bg-white/10`
- Icon + label alignment, `gap-3`
- Section separators with `border-white/10`

Primary navigation items:

1. Dashboard
2. Inventario
3. Órdenes de Trabajo
4. Herramientas
5. Auditoría
6. Usuarios (admin/Almacenista only)

### Top Bar

- Background: `bg-white`, bottom border `border-gray-200`
- Height: `h-16`
- Left: page title + breadcrumb
- Right: alert bell with badge, user avatar + role label, logout

### Cards

- Background: `bg-white`
- Border: `border border-gray-200`
- Border radius: `rounded-lg`
- Shadow: `shadow-sm`
- Padding: `p-4` or `p-6`

### Data Tables

- Header: `bg-gray-50`, `text-gray-700`, `font-semibold`, `text-sm`
- Row hover: `hover:bg-gray-50`
- Selected row: `bg-brand-50`
- Border: `border-b border-gray-200`
- Action buttons in last column, `text-sm`
- Empty state: centered illustration + message + primary CTA

### Badges

Use `rounded-full px-2.5 py-0.5 text-xs font-medium`:

- Success: `bg-success-100 text-success-800`
- Warning: `bg-warning-100 text-warning-800`
- Critical: `bg-critical-100 text-critical-800`
- Info: `bg-info-100 text-info-800`
- Neutral: `bg-gray-100 text-gray-800`

### Buttons

| Variant | Classes | Usage |
|---------|---------|-------|
| Primary | `bg-brand-800 text-white hover:bg-brand-900` | Main actions |
| Secondary | `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50` | Cancel, secondary |
| Danger | `bg-critical-500 text-white hover:bg-critical-600` | Delete, descargar |
| Ghost | `text-brand-700 hover:bg-brand-50` | Inline actions |

### Forms

- Labels: `block text-sm font-medium text-gray-700 mb-1`
- Inputs: `w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500`
- Required indicator: `text-critical-500` asterisk
- Help text: `text-xs text-gray-500 mt-1`
- Validation error: `text-sm text-critical-600 mt-1`

### Alerts

- Critical stock alert card: `bg-critical-50 border border-critical-200 text-critical-800`
- Overdue tool alert card: `bg-warning-50 border border-warning-200 text-warning-800`
- Inline success: `bg-success-50 border border-success-200 text-success-800`
- Inline info: `bg-info-50 border border-info-200 text-info-800`

## Screens

### Dashboard

- Alert panel at top: critical stock + overdue tools
- KPI cards: total components, active OTs, loaned tools, pending dispatches
- Recent activity table (last 10 audit entries)
- Quick-action buttons: "Registrar entrada", "Nueva OT", "Prestar herramienta"

### Inventory Search

- Prominent search bar with filters (nombre, número de parte, aplicación)
- Table: SKU, Nombre, Ubicación, Stock, Mínimo, Estado
- Critical rows highlighted with left border `border-l-4 border-critical-500`
- "Registrar entrada" primary action

### Work Orders

- Two views:
  - Almacenista: all OTs with status filters
  - Técnico: only assigned OTs
- Kanban-style status board (optional) or filtered table
- OT detail: equipment info, status timeline, part requests, technical report, delivery note

### Tool Custody

- Tool registry table
- Loan/return form
- Today's loans panel
- Overdue alerts

## Motion

Keep motion minimal and functional:

- Transition durations: `150ms` for hovers and focus; `200ms` for modals and panels.
- Easing: `ease-in-out` for standard transitions, `cubic-bezier(0.4, 0, 0.2, 1)` for panels.
- Avoid decorative animations, parallax, or bouncing effects.
- Use `fade-in` only for modals and alert banners.

## Responsive Rules

- Sidebar collapses to icon rail at `lg` breakpoint.
- Tables horizontally scroll on small screens; never compress columns below readable widths.
- Forms use single-column layout below `md` breakpoint.
- Alert cards stack vertically on mobile.

## Accessibility

- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text and UI components.
- Focus rings: `ring-2 ring-brand-500 ring-offset-2` on all interactive elements.
- Form labels explicitly associated with inputs.
- Status not conveyed by color alone: combine badges with text labels.

## Implementation Notes

- Use Tailwind CSS utility classes. No custom CSS unless unavoidable.
- Prefer Headless UI components for accessible dialogs, dropdowns, and tabs.
- Use Heroicons for iconography.
- Keep bundle size low: the system must load quickly on limited naval-base bandwidth.
