# Spec: Sistema de Inventario del Taller de Electrónica - Armada RD

## Context

The Dominican Republic Navy (Armada de República Dominicana, ARD) electronics workshop needs a centralized inventory, repair-order, and tool-custody system. The current process is manual or fragmented, creating gaps in traceability, stock control, and accountability for institutional resources.

## Why now

- Institutional requirement for transparent use of naval resources.
- Need to track parts from warehouse to specific ship/equipment repair.
- Need immutable audit evidence for military oversight.
- Critical stock shortages for fleet-essential components must be visible immediately.

## Success criteria

1. An Almacenista can receive stock, dispatch parts against approved work orders, loan tools, and process disposals with full traceability.
2. A Técnico can view only their assigned work orders, request parts, update repair status, and submit the final technical report.
3. The system alerts users when critical components fall below minimum stock.
4. Every data mutation is recorded with timestamp, user, IP, and action.
5. Sessions expire after 15 minutes of inactivity.

## Out of scope

- Integration with external Navy ERP/logistics systems (M-4) beyond document reference fields.
- Mobile native app; target is responsive web.
- Financial accounting/costing unless explicitly enabled per role.
- Barcode/RFID scanning hardware integration.
- Offline mode.

## Module 1: Users, Roles, and Permissions (RBAC)

### Roles

#### ROL-01 Encargado de Inventario (Almacenista)

Profile: Enlisted or junior officer responsible for the physical custody of the workshop space.

Permissions:
- Stock management: register component entry (linked to Oficio/Conduce/Factura or direct/no-document), modify quantities, update physical locations.
- Tool control: register daily checkout and return of measurement equipment.
- Parts dispatch: validate and process physical exit of parts requested for approved repairs.
- Equipment dispatch: validate and process physical exit of repaired/maintained equipment for return to unit.
- Work-order tracking: monitor status of OTs assigned to technicians.
- Disposal: register and process permanent disposal of obsolete/damaged equipment or tools.

#### ROL-02 Técnico (Especialista Naval)

Profile: Specialist assigned to workbenches for equipment repair and diagnosis.

Permissions:
- Work orders: view only assigned OTs, update repair status (En diagnóstico, Esperando repuesto, Reparado), write final technical report.
- Parts request: create digital part requests for active repair; inventory is deducted only after Almacenista approves physical dispatch.
- Restrictions: cannot manually modify inventory, delete records, or view part costs if the workshop supervisor restricts it.

### Acceptance criteria

- [ ] Users authenticate with email/password and receive a JWT.
- [ ] Each user has exactly one role.
- [ ] API permissions enforce role boundaries on every endpoint.
- [ ] An optional cost-visibility flag can hide financial fields from technicians.

## Module 2: Stock and Inventory Base

### Data model

- **Componente** (Component / part)
  - `sku` (unique)
  - `nombre` (name)
  - `numero_parte` (part number)
  - `aplicacion` (application, e.g. "Radio Harris")
  - `categoria`
  - `cantidad` (current stock)
  - `cantidad_minima` (critical threshold)
  - `ubicacion` (military storage nomenclature, e.g. "Estante A, Tramo 2, Gavetero 4")
  - `es_critico` (fleet-essential flag)
  - `unidad_medida`
  - `costo_unitario` (optional, visibility controlled)
  - `descripcion`

- **Categoría**
  - `nombre`, `descripcion`

- **Entrada de Stock** (Stock reception)
  - `tipo_documento`: Oficio / Conduce / Factura / Directo
  - `numero_documento`
  - `proveedor_origen`
  - `fecha_entrada`
  - `usuario` (who registered)
  - Lines: componente, cantidad, costo (optional)

### Functional requirements

- [ ] **RF-03** Register each component with exact physical location using military storage nomenclature.
- [ ] **RF-04** Register stock entry linked to Oficio de Envío, Conduce, Factura (M-4, direct purchase, donation), or direct/no-document entry.
- [ ] **RF-05** Display automatic visual alerts on the dashboard when critical fleet-essential components fall below minimum stock.
- [ ] **RF-06** Provide a fast search screen with filters by name, part number, and application.

### Acceptance criteria

- [ ] Searching "Radio Harris" lists all compatible parts and modules.
- [ ] Critical items below threshold appear in a dashboard alert panel.
- [ ] Stock quantities update correctly on entry and approved dispatch.
- [ ] Location field accepts free-form military nomenclature.

## Module 3: Repair and Work-Order Management (OTs)

### Data model

- **Orden de Trabajo (OT)**
  - `numero` (unique sequential, e.g. OT-2026-00001)
  - `fecha_ingreso`
  - `unidad_buque_origen` (e.g. GC-101, Astilleros Navales)
  - `oficial_entrega_nombre`
  - `oficial_entrega_grado`
  - `marca`, `modelo`, `numero_serie`
  - `numero_serie_militar` (if applicable)
  - `estado`: Recibido / En diagnóstico / Esperando repuesto / En reparación / Reparado / Entregado
  - `tecnico_asignado` (User)
  - `diagnostico_final`
  - `fecha_cierre`
  - `hoja_entrega_digital` (generated PDF reference)

- **Consumo de Material por OT**
  - `ot` (FK)
  - `componente` (FK)
  - `cantidad`
  - `fecha_consumo`
  - `tecnico` (who requested)
  - `almacenista` (who approved dispatch)

### Functional requirements

- [ ] **RF-07** Register incoming equipment with sequential number, origin unit/ship, delivery officer data, brand, model, and serial numbers.
- [ ] **RF-08** Every part removed from inventory for a repair must be linked to an active work order; no unjustified exits.
- [ ] **RF-09** On closure, record final diagnosis, replaced parts, and generate a printable digital delivery note for the retrieving ship/department.

### Acceptance criteria

- [ ] OT number is auto-generated and unique.
- [ ] Technicians see only OTs where `tecnico_asignado` matches their user.
- [ ] Material consumption deducts stock only after Almacenista approval.
- [ ] Delivery note is viewable/printable from the OT detail page.

## Module 4: Tool Custody

### Data model

- **Herramienta**
  - `codigo` (unique)
  - `nombre`
  - `tipo` (osciloscopio, multímetro, estación de calor, analizador de antena, etc.)
  - `marca`, `modelo`, `numero_serie`
  - `estado`: Disponible / Prestada / Dañada / Descargada
  - `fecha_compra` (optional)

- **Préstamo Diario**
  - `herramienta` (FK)
  - `tecnico` (FK)
  - `fecha_prestamo`
  - `fecha_devolucion`
  - `observaciones`

### Functional requirements

- [ ] **RF-10** Register workshop measurement and support tools in a database.
- [ ] **RF-11** Register daily tool checkout to technician and confirm return at end of shift.
- [ ] **RF-12** Process permanent disposal of tools/equipment due to irreparable damage or discard, keeping immutable historical record.

### Acceptance criteria

- [ ] A tool marked "Prestada" cannot be loaned again until returned.
- [ ] Overdue tools (not returned by end of day) appear in a dashboard alert.
- [ ] Disposed tools remain visible in historical reports.

## Module 5: Transparency and Audit

### Functional requirements

- [ ] **RF-13** Automatically log date, time, and username for every stock movement or change.
- [ ] **RNF-05** Server-side immutable audit log records every insert, modification, or deletion with timestamp, source IP, and user account.

### Acceptance criteria

- [ ] A middleware or model signal writes an `AuditLog` row for every create/update/delete.
- [ ] The log includes action type, table, record id, serialized changes, user id, IP, and timestamp.
- [ ] Audit logs are visible to admin/Almacenista but cannot be edited or deleted from the UI.

## Non-functional requirements

- [ ] **RNF-01** Responsive UI: desktop, laptop, tablet.
- [ ] **RNF-02** Low bandwidth consumption; optimized for intermittent naval base network.
- [ ] **RNF-03** Standard stack: HTML5/JavaScript frontend, Python backend, relational database (PostgreSQL).
- [ ] **RNF-04** HTTPS-only communication.
- [ ] **RNF-05** Immutable server-side audit log (see Module 5).
- [ ] **RNF-06** Automatic session destruction after 15 minutes of inactivity.

## API surface (v1)

### Auth
- `POST /api/v1/auth/login/` — JWT login
- `POST /api/v1/auth/refresh/` — token refresh
- `POST /api/v1/auth/logout/` — logout
- `GET /api/v1/auth/me/` — current user

### Users (admin only)
- `GET/POST /api/v1/users/`
- `GET/PUT/PATCH/DELETE /api/v1/users/{id}/`

### Inventory
- `GET/POST /api/v1/componentes/`
- `GET/PUT/PATCH/DELETE /api/v1/componentes/{id}/`
- `GET/POST /api/v1/categorias/`
- `GET/POST /api/v1/entradas/`
- `GET/POST /api/v1/alertas-stock/` (read-only, critical items)

### Work orders
- `GET/POST /api/v1/ordenes-trabajo/`
- `GET/PUT/PATCH /api/v1/ordenes-trabajo/{id}/`
- `GET/POST /api/v1/consumos-ot/`
- `POST /api/v1/ordenes-trabajo/{id}/aprobar-salida/` (Almacenista)
- `POST /api/v1/ordenes-trabajo/{id}/cerrar/` (Técnico + Almacenista)
- `GET /api/v1/ordenes-trabajo/{id}/hoja-entrega/`

### Tool custody
- `GET/POST /api/v1/herramientas/`
- `GET/PUT/PATCH /api/v1/herramientas/{id}/`
- `GET/POST /api/v1/prestamos/`
- `POST /api/v1/prestamos/{id}/devolver/`

### Audit
- `GET /api/v1/auditoria/` (admin/Almacenista)

## UI/UX priorities

1. Dashboard with critical stock alerts and active/overdue loans.
2. Fast search-first inventory screen.
3. Clear work-order status workflow for technicians.
4. Simple loan/return flow for tools.
5. Printable delivery note for closed OTs.

## Implementation phases

### Phase 1 — Foundation
- Project scaffold: Django + DRF + PostgreSQL backend, React + Vite + Tailwind frontend.
- User model and JWT auth.
- Audit middleware and base models.

### Phase 2 — Inventory core
- Categories and components CRUD.
- Stock entry with document linking.
- Critical stock alerts.

### Phase 3 — Work orders
- OT lifecycle and assignment.
- Part requests and approved consumption.
- Printable delivery note.

### Phase 4 — Tool custody
- Tool registry.
- Daily loan/return flow.
- Disposal process.

### Phase 5 — Security hardening
- 15-minute session timeout.
- HTTPS enforcement configuration.
- Audit log UI and immutability checks.

## Open questions

1. Should the system support a third role (e.g., Jefe de Taller) with read-only oversight or configuration rights?
2. Is there an existing list of categories/critical components that should be pre-seeded?
3. Should the printable delivery note include a digital signature or approval stamp?
4. Which deployment environment will the Navy provide? (server OS, reverse proxy, SSL certificate source)
