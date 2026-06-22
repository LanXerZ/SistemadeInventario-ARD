# Requirements: Sistema de Inventario del Taller de Electrónica - Armada RD

**Defined:** 2026-06-13 (last updated 2026-06-21 con refactor Despacho)
**Core Value:** An Almacenista can account for every part and tool that enters or leaves the workshop, despachando items a un solicitante con trazabilidad completa.

## v1 Requirements

### Authentication & RBAC

- [x] **AUTH-01**: Users authenticate with email/password and receive a JWT
- [x] **AUTH-02**: Each user has exactly one role (Almacenista or Técnico)
- [x] **AUTH-03**: API permissions enforce role boundaries on every endpoint
- [x] **AUTH-04**: An optional cost-visibility flag hides financial fields from technicians
- [x] **AUTH-05**: Sessions expire automatically after 15 minutes of inactivity

### Inventory & Stock Control

- [x] **INV-01**: Register each component with exact physical location using military storage nomenclature
- [x] **INV-02**: Register stock entry linked to Oficio de Envío, Conduce, Factura, or direct/no-document entry
- [x] **INV-03**: Display automatic visual alerts when critical fleet-essential components fall below minimum stock
- [x] **INV-04**: Provide a fast search screen with filters by name, part number, and application
- [x] **INV-05**: Categorize components and support critical-item flagging
- [x] **INV-06**: Track current stock quantity and minimum threshold per component

### Despachos (DSP) — REEMPLAZA OT-01..07 y TOOL-01..05

- [x] **DSP-01**: Cada Despacho se identifica con número correlativo `DV-YYYY-XXXXX` único
- [x] **DSP-02**: El Almacenista selecciona los items a despachar desde el inventario (no texto libre); el sistema muestra nombre, tipo, stock y estado (OK / Crítico / Asignado)
- [x] **DSP-03**: Los consumibles descuentan stock y crean `StockMovement.EXIT` atómicamente; las herramientas serializadas se despachan eligiendo la unidad específica (ItemUnit)
- [x] **DSP-04**: El campo "entregado por" se llena automáticamente desde el usuario logueado; el campo "solicitante" se selecciona de un catálogo con autocomplete+create
- [x] **DSP-05**: Una herramienta asignada queda con `ItemUnit.status='asignado'` y crea `ItemLoan` vinculado al Solicitante
- [x] **DSP-06**: La cancelación del Despacho revierte `StockMovement.EXIT` y libera las unidades asignadas, todo atómicamente

### Audit & Security

- [x] **AUDIT-01**: Automatically log date, time, and username for every stock movement or change
- [x] **AUDIT-02**: Server-side immutable audit log records every insert, modification, or deletion with timestamp, source IP, and user account
- [x] **AUDIT-03**: Audit logs are visible to admin/Almacenista but cannot be edited or deleted from the UI
- [x] **AUDIT-04**: Serve all communication over HTTPS in production

## v2 Requirements

### Reporting

- [x] **REPORT-01**: Generate inventory reports by category, location, and critical status (PDF/Excel, variantes: completo, crítico, herramientas)
- [x] **REPORT-02**: Generate despachos history reports by solicitante and unit (PDF/Excel)
- [x] **REPORT-03**: Generate tool custody and disposal reports (unidades asignadas, vencidas, dadas de baja)
- [x] **REPORT-04**: Generate assignment reports — activas, histórico, solo vencidas (PDF/Excel)
- [x] **REPORT-05**: Generate critical stock report (solo items con `quantity <= minimum_stock`)

### Advanced Roles

- **ROLE-01**: Add a Jefe de Taller role with read-only oversight and configuration rights

## Reemplazos del refactor 2026-06-21

| Requerimiento legacy | Reemplazo |
|----------------------|-----------|
| OT-01..07 (Work Order lifecycle) | DSP-01..06 (Despacho inmediato) |
| TOOL-01..05 (Tool custody) | DSP-02, DSP-03, DSP-05 (items-herramienta + ItemUnit + ItemLoan) |

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
| AUTH-01 | Phase 1 | ✅ |
| AUTH-02 | Phase 1 | ✅ |
| AUTH-03 | Phase 1 | ✅ |
| AUTH-04 | Phase 1 | ✅ |
| AUTH-05 | Phase 5 | ✅ |
| INV-01 | Phase 2 | ✅ |
| INV-02 | Phase 2 | ✅ |
| INV-03 | Phase 2 | ✅ |
| INV-04 | Phase 2 | ✅ |
| INV-05 | Phase 2 | ✅ |
| INV-06 | Phase 2 | ✅ |
| DSP-01 | Phase 7 | ✅ |
| DSP-02 | Phase 7 | ✅ |
| DSP-03 | Phase 7 | ✅ |
| DSP-04 | Phase 7 | ✅ |
| DSP-05 | Phase 7 | ✅ |
| DSP-06 | Phase 7 | ✅ |
| AUDIT-01 | Phase 1 | ✅ |
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
