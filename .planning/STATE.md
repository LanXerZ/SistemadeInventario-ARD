# State: Sistema de Inventario del Taller de Electrónica - Armada RD

**Project:** Taller de Electrónica - Armada RD
**Current phase:** Post-MVP Improvements
**Status:** In Progress

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-13)

**Core value:** An Almacenista can account for every part and tool that enters or leaves the workshop, and a Técnico can only see and affect the work orders and part requests assigned to them.

**Current focus:** Implementing high-priority improvements from post-MVP report.

## Completed Work

### MVP (Phases 1-5)
- [x] Project directory created: `C:\Users\warlyn_estrella\TallerElectronicaARD`
- [x] Git initialized with `main` branch
- [x] `CLAUDE.md` created with project context and skill routing
- [x] `SPEC.md` created from official requirements document
- [x] Superpowers plugin installed
- [x] GSD Core installed for OpenCode
- [x] `DESIGN.md` created with design system and UI conventions
- [x] Backend scaffold: Django REST with apps (accounts, audit, inventory, workorders, tools)
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
- [x] Button renamed from 'Buscar' to 'Filtrar'
- [x] WorkOrder model with sequential OT number generation (OT-YYYY-XXXXX)
- [x] WorkOrderPart model for part requests/approvals/consumption
- [x] Work order API with CRUD and custom actions
- [x] Work order frontend pages: list, form, detail
- [x] Technician permissions: only assigned work orders + request parts
- [x] Printable delivery note
- [x] Tool model with registry (code, type, brand, model, serial)
- [x] ToolLoan model for daily loans/returns
- [x] Tool custody API with loan/return/disposal actions
- [x] Tool custody frontend pages: list, form, detail
- [x] Overdue tool detection
- [x] Session timeout warning and auto-logout (15 minutes)
- [x] Audit log API endpoints (read-only)
- [x] Audit log UI for admin/almacenista
- [x] Production security settings (HTTPS, HSTS, secure cookies)

### Post-MVP Improvements (Completed)
- [x] User management UI (list, create, edit, delete users)
- [x] PDF reports for inventory, work orders, and tools
- [x] Excel reports for inventory, work orders, and tools
- [x] Notification badge for pending part requests
- [x] Global search across inventory, work orders, and tools
- [x] Enhanced dashboard with statistics and charts
- [x] Per-object audit history tabs
- [x] 34 passing backend tests

## Next Steps

1. Implement low-priority technical improvements:
   - Frontend E2E tests
   - PostgreSQL production setup
   - Automated backups
   - API rate limiting
2. Deploy to production
3. User acceptance testing

## Blockers

None.

## Notes

- Stack decision: React 18 + Vite + TailwindCSS frontend, Django REST + Python backend, PostgreSQL database.
- Design-driven development: `DESIGN.md` must be approved before implementation begins.
- Spec-driven development: `REQUIREMENTS.md` and `ROADMAP.md` are the source of truth for phases.

---
*State updated: 2026-06-13 after implementing medium-priority improvements*
