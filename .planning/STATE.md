# State: Sistema de Inventario del Taller de Electrónica - Armada RD

**Project:** Taller de Electrónica - Armada RD
**Current phase:** Refactor Despacho + Unificación Tool → Item
**Status:** In Progress

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-13)

**Core value:** An Almacenista can account for every part and tool that enters or leaves the workshop, despachando items a un solicitante con trazabilidad completa; las herramientas se gestionan como un tipo de item con unidades físicas serializadas.

**Current focus:** Refactor del modelo de datos: la OT se renombra a Despacho (vale de almacén inmediato), las herramientas se unifican con los items de inventario, y se introduce el modelo Solicitante con autocomplete+create.

## Completed Work

### MVP (Phases 1-5)
- [x] Project directory created: `C:\Users\warlyn_estrella\TallerElectronicaARD`
- [x] Git initialized with `main` branch
- [x] `CLAUDE.md` created with project context and skill routing
- [x] `SPEC.md` created from official requirements document
- [x] Superpowers plugin installed
- [x] GSD Core installed for OpenCode
- [x] `DESIGN.md` created with design system and UI conventions
- [x] Backend scaffold: Django REST with apps (accounts, audit, inventory, workorders)
- [x] Custom User model with email login and RBAC (admin, almacenista, técnico)
- [x] JWT authentication with 15-min access tokens and refresh rotation
- [x] Audit logging middleware and signals for all model changes
- [x] Auth API endpoints: login, refresh, logout, me, user CRUD
- [x] Frontend scaffold: React 18 + Vite + TailwindCSS
- [x] Auth context with JWT token management and auto-refresh
- [x] Login page with form validation
- [x] Protected routes with role-based access control
- [x] Responsive layout with sidebar navigation
- [x] API service with axios interceptors
- [x] Category, Item, and StockMovement models implemented
- [x] Inventory API with CRUD, search, filters, and critical stock alerts
- [x] Inventory frontend pages: list, create/edit form, detail
- [x] Stock entry/exit form with document tracking
- [x] Dashboard with critical stock alerts
- [x] Category filter fixed (custom ItemFilter with NumberFilter)
- [x] Item image upload with local storage
- [x] Image preview in inventory list and detail
- [x] Session timeout warning and auto-logout (15 minutes)
- [x] Audit log API endpoints (read-only)
- [x] Audit log UI for admin/almacenista
- [x] Production security settings (HTTPS, HSTS, secure cookies)

### Post-MVP Improvements (Completed)
- [x] User management UI (list, create, edit, delete users)
- [x] PDF reports for inventory, despachos, e items-herramienta
- [x] Excel reports for inventory, despachos, e items-herramienta
- [x] Global search across inventory and despachos
- [x] Enhanced dashboard with statistics and charts
- [x] Per-object audit history tabs
- [x] 39 passing backend tests

### Refactor Despacho + Unificación Tool → Item (Completed)
- [x] **Unificación Tool → Item**: las herramientas pasan a ser `Item(kind='herramienta', track_by_serial=True)`. Cada unidad física es un `ItemUnit` con serial único.
- [x] **ItemUnit model**: unidades físicas serializadas con status `Disponible | Asignado | En Reparación | Descargado`
- [x] **ItemLoan model**: préstamos de unidades (vinculados a Solicitante o User)
- [x] **Solicitante model**: persona o unidad que solicita despachos, con autocomplete+create
- [x] **Despacho model** (reemplaza WorkOrder): vale de almacén con numeración `DV-YYYY-XXXXX`
- [x] **LineaDespacho model**: cada item (consumible) o unidad física (herramienta) despachada
- [x] **DispatchService**: creación atómica con `transaction.atomic` + `select_for_update`
- [x] **Cancelación atómica** que revierte `StockMovement.EXIT` y libera `ItemUnit`
- [x] **Frontend**: `SolicitantePicker` (autocomplete + modal), `ItemSelector` (typeahead con detalle de stock/estado)
- [x] **Reportes PDF/Excel** actualizados con nuevas columnas
- [x] **39 tests** (14 nuevos de Despacho) pasando
- [x] **Data migration** de Tool/ToolLoan a Item(kind=herramienta)/ItemUnit/ItemLoan
- [x] **Eliminada app `tools/`** (completamente refactorizada en `inventory/`)

### LocationType + Tipo de usabilidad + Gestión de unidades (Completed)
- [x] **LocationType model**: tipos de ubicación gestionables desde la UI (reemplaza TextChoices hardcoded)
- [x] **FK en Location**: `Location.location_type` ahora es ForeignKey a LocationType
- [x] **Data migration**: preserva los 5 tipos default (taller, base_naval, unidad_naval, comandancia, destacamento)
- [x] **LocationTypePicker**: autocomplete + create inline (mismo patrón que SolicitantePicker)
- [x] **LocationsPage** con pestaña "Tipos de ubicación" (CRUD completo)
- [x] **"Tipo de usabilidad"** en ItemFormPage con radio buttons (consumible / herramienta)
- [x] **Conditional rendering**: herramientas ocultan `quantity`/`minimum_stock` (se mide por unidades)
- [x] **Display labels** de ItemUnit.Status: `Disponible / Asignado / En Reparación / Descargado`
- [x] **`availability_state` automático** solo para consumibles (no para herramientas)
- [x] **Endpoint `set_status`** para cambiar manualmente: Disponible ↔ En Reparación ↔ Descargado
- [x] **ItemDetailPage** con pestaña "Unidades" para herramientas: lista de seriales, modal de cambio de estado, botón "Agregar serial"
- [x] **InventoryPage** rediseñado: para herramientas muestra lista de seriales con badge de estado (en lugar de stack `30/30`)
- [x] **49 tests** (10 nuevos de LocationType + set_status) pasando

### Asignaciones Activas + Recepción de devoluciones (Completed)
- [x] **Endpoint `receive`** en ItemUnit: cierra ItemLoan activo + cambia estado final atómicamente
- [x] **Endpoint `extend`** en ItemLoan: extiende `expected_return_at` por N días
- [x] **ItemDetailPage**: botón "Recibir devolución" para unidades con `status=asignado`, con modal de estado final
- [x] **Página "Asignaciones Activas"** en `/asignaciones`: lista de ItemLoan activos con búsqueda, filtros, badge de vencido
- [x] **Acciones inline**: Recibir (modal), Renovar (modal con días)
- [x] **Sidebar**: link "Asignaciones" con `ArrowsRightLeftIcon`, solo visible para admin/almacenista
- [x] **9 tests nuevos** (5 de receive, 4 de extend)

### Reportes PDF/Excel mejorados (Completed)
- [x] **Reporte de Asignaciones**: PDF/Excel con filtros `?status=active|all` y `?overdue=true|false`
  - Activos, Histórico completo, Solo vencidos
- [x] **Reporte de Stock Crítico**: PDF/Excel con `?critical=true` (solo items con `is_critical`)
- [x] **Reporte de Herramientas**: PDF/Excel con `?kind=herramienta`
- [x] **Sanitización de títulos de Excel** (elimina `/`, `\`, `:`, `*`, `?`, `[]`)
- [x] **Permisos estrictos**: solo admin/almacenista pueden generar reportes
- [x] **Frontend: dropdown de reportes** en `InventoryPage` con 6 opciones (PDF/Excel × completo/crítico/herramientas)
- [x] **Frontend: dropdown de reportes** en `AsignacionesActivasPage` con 5 opciones
- [x] **10 tests nuevos** (ReportEndpointsTest) cubriendo permisos, formato y filtros
- [x] **68 tests totales** pasando

### Production Deploy (Completed)
- [x] Backend deployed to Render: https://sistemadeinventario-ard-api.onrender.com/
- [x] PostgreSQL database provisioned on Render
- [x] Frontend deployed to GitHub Pages: https://lanxerz.github.io/SistemadeInventario-ARD/
- [x] Public `/health/` endpoint for Render health checks
- [x] `render.yaml` configured with correct CORS origins, SSL redirect disabled, robust start command
- [x] Default superuser managed via `seed_demo_data` (admin/almacenista/tecnico demo)
- [x] GitHub Pages source set to GitHub Actions for Vite build deployment

## Next Steps

1. **Technical improvements:**
   - Frontend E2E tests.
   - API rate limiting.
   - Automated database backups.
   - Enhanced monitoring for Render service.
2. **Documentation:**
   - Update runbooks for common production issues.

## Blockers

None.

## Notes

- Stack decision: React 18 + Vite + TailwindCSS frontend, Django REST + Python backend, PostgreSQL database.
- Production deploy stack: Render (Django backend + PostgreSQL) + GitHub Pages (Vite frontend via GitHub Actions).
- Design-driven development: `DESIGN.md` must be approved before implementation begins.
- Spec-driven development: `REQUIREMENTS.md` and `ROADMAP.md` are the source of truth for phases.
- App `tools/` fue eliminada. Las herramientas viven ahora en `inventory.Item(kind='herramienta')` + `inventory.ItemUnit` + `inventory.ItemLoan`.
- `WorkOrder` renombrado a `Despacho`. Numeración `DV-YYYY-XXXXX` (antes `OT-YYYY-XXXXX`).

---
*State updated: 2026-06-21 after Despacho refactor and Tool→Item unification*
