# Roadmap: Sistema de Inventario del Taller de Electrónica - Armada RD

**Created:** 2026-06-13
**Project mode:** mvp

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Project scaffold, auth, audit middleware | AUTH-01..04, AUDIT-01 | 5 | ✅ |
| 2 | Inventory Core | Component categories, stock entry, critical alerts | INV-01..06 | 6 | ✅ |
| 3 | Work Orders | OT lifecycle, assignments, part requests, delivery note | OT-01..07 | 7 |
| 4 | Tool Custody | Tool registry, daily loans, returns, disposal | TOOL-01..05 | 5 |
| 5 | Security Hardening | Session timeout, HTTPS config, audit UI, immutability | AUTH-05, AUDIT-02..04 | 4 |

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

### Phase 3: Work Orders
**Goal:** OT lifecycle from intake to closure with part consumption and printable delivery note.
**Mode:** mvp
**Requirements:** OT-01, OT-02, OT-03, OT-04, OT-05, OT-06, OT-07

**Success Criteria:**
1. OT number auto-generates uniquely (e.g., OT-2026-00001)
2. Technician sees only assigned OTs and can update repair status
3. Technician can request parts; inventory deducts only after Almacenista approval
4. Every consumed part is linked to an active OT
5. Closed OT generates a printable digital delivery note

---

### Phase 4: Tool Custody
**Goal:** Tool registry, daily loan/return flow, overdue alerts, and disposal.
**Mode:** mvp
**Requirements:** TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05

**Success Criteria:**
1. Almacenista can register tools with code, type, brand, model, and serial
2. Daily loan form assigns a tool to a technician at shift start
3. Return form marks tool available again and records return time
4. Loaned tools cannot be loaned again until returned
5. Disposed tools remain visible in historical reports with reason and date

---

### Phase 5: Security Hardening
**Goal:** Production-ready security with session timeout, HTTPS enforcement, and audit UI.
**Mode:** mvp
**Requirements:** AUTH-05, AUDIT-02, AUDIT-03, AUDIT-04

**Success Criteria:**
1. Sessions expire after 15 minutes of inactivity on both frontend and backend
2. Audit log captures timestamp, IP, user, table, record id, and serialized changes
3. Audit log UI is read-only for admin/Almacenista
4. Production config enforces HTTPS and secure cookies

---

*Roadmap created: 2026-06-13*
