# Requirements: Sistema de Inventario del Taller de Electrónica - Armada RD

**Defined:** 2026-06-13
**Core Value:** An Almacenista can account for every part and tool that enters or leaves the workshop, and a Técnico can only see and affect the work orders and part requests assigned to them.

## v1 Requirements

### Authentication & RBAC

- [ ] **AUTH-01**: Users authenticate with email/password and receive a JWT
- [ ] **AUTH-02**: Each user has exactly one role (Almacenista or Técnico)
- [ ] **AUTH-03**: API permissions enforce role boundaries on every endpoint
- [ ] **AUTH-04**: An optional cost-visibility flag hides financial fields from technicians
- [ ] **AUTH-05**: Sessions expire automatically after 15 minutes of inactivity

### Inventory & Stock Control

- [ ] **INV-01**: Register each component with exact physical location using military storage nomenclature
- [ ] **INV-02**: Register stock entry linked to Oficio de Envío, Conduce, Factura, or direct/no-document entry
- [ ] **INV-03**: Display automatic visual alerts when critical fleet-essential components fall below minimum stock
- [ ] **INV-04**: Provide a fast search screen with filters by name, part number, and application
- [ ] **INV-05**: Categorize components and support critical-item flagging
- [ ] **INV-06**: Track current stock quantity and minimum threshold per component

### Work Orders (OTs)

- [ ] **OT-01**: Register incoming equipment with sequential OT number, origin unit/ship, delivery officer data, brand, model, and serial numbers
- [ ] **OT-02**: Link every part removed from inventory to an active work order
- [ ] **OT-03**: Technicians see only OTs assigned to them
- [ ] **OT-04**: Technicians update repair status (En diagnóstico, Esperando repuesto, Reparado)
- [ ] **OT-05**: Technicians create digital part requests for active repairs
- [ ] **OT-06**: Inventory deducts stock only after Almacenista approves physical dispatch
- [ ] **OT-07**: Close OT with final diagnosis, replaced parts, and generate printable digital delivery note

### Tool Custody

- [ ] **TOOL-01**: Register workshop measurement and support tools in a database
- [ ] **TOOL-02**: Register daily tool checkout to a technician and confirm return at end of shift
- [ ] **TOOL-03**: Prevent loan of a tool already marked as loaned until returned
- [ ] **TOOL-04**: Show overdue tools (not returned by end of day) in dashboard alert
- [ ] **TOOL-05**: Process permanent disposal of tools/equipment due to irreparable damage or discard, keeping immutable historical record

### Audit & Security

- [ ] **AUDIT-01**: Automatically log date, time, and username for every stock movement or change
- [ ] **AUDIT-02**: Server-side immutable audit log records every insert, modification, or deletion with timestamp, source IP, and user account
- [ ] **AUDIT-03**: Audit logs are visible to admin/Almacenista but cannot be edited or deleted from the UI
- [ ] **AUDIT-04**: Serve all communication over HTTPS in production

## v2 Requirements

### Reporting

- **REPORT-01**: Generate inventory reports by category, location, and critical status
- **REPORT-02**: Generate work-order history reports by unit/ship and technician
- **REPORT-03**: Generate tool custody and disposal reports

### Advanced Roles

- **ROLE-01**: Add a Jefe de Taller role with read-only oversight and configuration rights

## Out of Scope

| Feature | Reason |
|---------|--------|
| Integration with external Navy ERP (M-4) | Beyond document reference fields; API unavailable |
| Native mobile application | Web responsive covers required devices |
| Financial accounting/costing | Optional cost field only; full accounting deferred |
| Barcode/RFID scanning | Hardware integration not available |
| Offline mode | Requires additional sync architecture; defer to v2+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 5 | Pending |
| INV-01 | Phase 2 | Pending |
| INV-02 | Phase 2 | Pending |
| INV-03 | Phase 2 | Pending |
| INV-04 | Phase 2 | Pending |
| INV-05 | Phase 2 | Pending |
| INV-06 | Phase 2 | Pending |
| OT-01 | Phase 3 | Pending |
| OT-02 | Phase 3 | Pending |
| OT-03 | Phase 3 | Pending |
| OT-04 | Phase 3 | Pending |
| OT-05 | Phase 3 | Pending |
| OT-06 | Phase 3 | Pending |
| OT-07 | Phase 3 | Pending |
| TOOL-01 | Phase 4 | Pending |
| TOOL-02 | Phase 4 | Pending |
| TOOL-03 | Phase 4 | Pending |
| TOOL-04 | Phase 4 | Pending |
| TOOL-05 | Phase 4 | Pending |
| AUDIT-01 | Phase 1 | Pending |
| AUDIT-02 | Phase 5 | Pending |
| AUDIT-03 | Phase 5 | Pending |
| AUDIT-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-13*
*Last updated: 2026-06-13 after initial definition*
