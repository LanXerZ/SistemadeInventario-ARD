# Roadmap: Sistema de Inventario del Taller de Electrónica - Armada RD

**Created:** 2026-06-13
**Project mode:** mvp

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Project scaffold, auth, audit middleware | AUTH-01..04, AUDIT-01 | 5 | ✅ |
| 2 | Inventory Core | Component categories, stock entry, critical alerts | INV-01..06 | 6 | ✅ |
| 3 | Work Orders (legacy) | OT lifecycle, assignments, part requests, delivery note | OT-01..07 | 7 | ✅ → reemplazado en Fase 7 |
| 4 | Tool Custody (legacy) | Tool registry, daily loans, returns, disposal | TOOL-01..05 | 5 | ✅ → reemplazado en Fase 7 |
| 5 | Security Hardening | Session timeout, HTTPS config, audit UI, immutability | AUTH-05, AUDIT-02..04 | 4 | ✅ |
| 6 | Post-MVP Improvements | Reports, dashboard, search, audit history | (post-MVP) | 8 | ✅ |
| 7 | Despacho + Unificación Tool→Item | Despacho inmediato atómico, herramientas como items con serial, modelo Solicitante | DSP-01..06 | 6 | ✅ |

---

### Phase 1: Foundation ✅
**Goal:** A runnable Django + React project with JWT auth, RBAC, and audit middleware.
**Mode:** mvp
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUDIT-01
**Status:** Complete

**Success Criteria:**
1. ✅ `npm run dev` starts Vite frontend and Django backend runs on separate ports
2. ✅ User can log in with email/password and receive a JWT
3. ✅ API rejects unauthorized requests and enforces role boundaries
4. ✅ Every create/update/delete operation writes a row to the audit log
5. ⚠️ PostgreSQL is connected and migrations run successfully (SQLite for dev, PostgreSQL ready)

---

### Phase 2: Inventory Core ✅
**Goal:** Components, categories, stock entry, critical-stock alerts, and fast search.
**Mode:** mvp
**Requirements:** INV-01, INV-02, INV-03, INV-04, INV-05, INV-06
**Status:** Complete

**Success Criteria:**
1. ✅ Almacenista can create/edit components with SKU, location, category, and critical threshold
2. ✅ Stock entry form supports Oficio/Conduce/Factura/Directo document types
3. ✅ Dashboard shows visual alerts for critical items below minimum stock
4. ✅ Search returns results filtered by name, part number, or application in under 500ms
5. ✅ Stock quantities update correctly on entry

---

### Phase 3: Work Orders (legacy) ✅ → reemplazado en Fase 7
**Goal:** OT lifecycle from intake to closure with part consumption and printable delivery note.
**Mode:** mvp (replaced)
**Status:** Reemplazado en Fase 7 (Despacho inmediato atómico)

---

### Phase 4: Tool Custody (legacy) ✅ → reemplazado en Fase 7
**Goal:** Tool registry, daily loan/return flow, overdue alerts, and disposal.
**Mode:** mvp (replaced)
**Status:** Reemplazado en Fase 7 (herramientas unificadas a Item + ItemUnit + ItemLoan)

---

### Phase 5: Security Hardening ✅
**Goal:** Production-ready security with session timeout, HTTPS enforcement, and audit UI.
**Mode:** mvp
**Requirements:** AUTH-05, AUDIT-02, AUDIT-03, AUDIT-04
**Status:** Complete

**Success Criteria:**
1. ✅ Sessions expire after 15 minutes of inactivity on both frontend and backend
2. ✅ Audit log captures timestamp, IP, user, table, record id, and serialized changes
3. ✅ Audit log UI is read-only for admin/Almacenista
4. ✅ Production config enforces HTTPS and secure cookies

---

### Phase 7: Despacho + Unificación Tool → Item ✅
**Goal:** Refactor del modelo de datos: la OT pasa a ser un vale de despacho de almacén inmediato y atómico. Las herramientas se tratan como items de inventario con unidades físicas serializadas. Se introduce el modelo Solicitante con autocomplete+create.
**Mode:** refactor
**Requirements:** DSP-01..06 (reemplaza OT-01..07 y TOOL-01..05)
**Status:** Complete

**Success Criteria:**
1. ✅ Despacho con numeración `DV-YYYY-XXXXX` se genera y ejecuta atómicamente en un solo paso
2. ✅ Almacenista selecciona items del stock (no texto libre); el sistema muestra nombre, tipo, stock y estado (OK/Crítico/Asignado)
3. ✅ Herramientas serializadas se despachan eligiendo la unidad específica (ItemUnit); la unidad queda `Asignado` y se crea ItemLoan
4. ✅ Solicitante es un modelo nuevo con autocomplete + create-inline desde el formulario de despacho
5. ✅ Cancelación de despacho revierte `StockMovement.EXIT` y libera las unidades asignadas
6. ✅ Reportes PDF/Excel actualizados con nuevas columnas; endpoints funcionan con la nueva ruta `/work-orders/despachos/`

**Cambios clave del refactor:**
- `WorkOrder → Despacho` (renombre, app sigue `workorders`)
- `WorkOrderPart → LineaDespacho`
- `Tool/ToolLoan → Item(kind='herramienta')/ItemUnit/ItemLoan`
- App `tools/` eliminada (absorbida por `inventory/`)
- 7 estados OT → 2 estados Despacho (`issued`/`cancelled`)
- 11 acciones de taller → 1 acción `cancel`
- 14 tests nuevos (39 totales pasando)

---

*Roadmap created: 2026-06-13*
