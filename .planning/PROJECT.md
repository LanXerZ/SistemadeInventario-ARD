# Sistema de Inventario del Taller de Electrónica - Armada RD

## What This Is

A full-stack inventory, repair-order, and tool-custody system for the electronics workshop of the Dominican Republic Navy (Armada de República Dominicana). It tracks electronic components from warehouse entry to specific ship/equipment repair, manages daily tool loans to technicians, and produces immutable audit evidence for military oversight.

## Core Value

An Almacenista can account for every part and tool that enters or leaves the workshop, and a Técnico can only see and affect the work orders and part requests assigned to them.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Establish role-based access control for Almacenista and Técnico users
- [ ] Track electronic components with exact military-storage location and critical-stock alerts
- [ ] Record stock entry linked to Oficio, Conduce, Factura, or direct/no-document receipt
- [ ] Manage repair work orders (OTs) from intake through diagnosis to printable delivery note
- [ ] Control daily checkout and return of workshop measurement tools
- [ ] Process permanent disposal of obsolete or damaged equipment and tools
- [ ] Maintain immutable server-side audit logs with timestamp, IP, and user for every data mutation
- [ ] Enforce 15-minute session timeout and HTTPS-only communication

### Out of Scope

- Integration with external Navy ERP/logistics systems (M-4) beyond document reference fields
- Native mobile application; target is responsive web
- Financial accounting or costing unless explicitly enabled per role
- Barcode/RFID hardware integration
- Offline mode

## Context

The workshop currently relies on manual or fragmented processes. The Navy requires transparent use of institutional resources, traceability from warehouse to ship/equipment, and immutable audit evidence. The system must run on the institution's own servers under HTTPS, use a relational database (PostgreSQL), and remain usable on intermittent naval-base networks.

## Constraints

- **Tech stack**: React 18 + Vite + TailwindCSS frontend, Django REST + Python backend, PostgreSQL database
- **Security**: HTTPS-only, immutable audit logs, 15-minute session timeout
- **Network**: Must be lightweight and responsive under limited/intermittent bandwidth
- **Devices**: Desktop, laptop, and tablet access within the workshop network
- **Data**: All inventory movements must tie to a user, timestamp, and IP address

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Django REST + React + PostgreSQL | Matches institutional requirement for Python backend and relational DB; same stack as prior inventory project | — Pending |
| Adopt Superpowers + GSD Core + GStack | Superpowers enforces TDD and subagent execution; GSD manages context/phases; GStack provides review/QA/design skills | — Pending |
| Implement RBAC with exactly two primary roles | Requirement document defines Almacenista and Técnico; optional third role (Jefe de Taller) deferred | — Pending |
| Keep financial cost fields optional and visibility-controlled | Technicians may be restricted from viewing costs per requirements | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-13 after initialization*
