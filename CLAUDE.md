# Taller de Electrónica - Armada de República Dominicana

## Project overview

Full-stack inventory and work-order management system for the electronics workshop of the Dominican Republic Navy (Armada de República Dominicana).

**Domain:** Military electronics workshop — inventory control, repair orders, tool custody, and audit trails.

**Stack:**
- **Frontend:** React 18 + Vite + TailwindCSS + Headless UI + Heroicons + Axios
- **Backend:** Django REST Framework + Python
- **Database:** PostgreSQL
- **Auth:** JWT with role-based access control (RBAC)
- **Security:** HTTPS-only, immutable audit logs, 15-minute session timeout

## Requirements summary

System modules derived from the official requirements document:

1. **User management, roles, and permissions (RBAC)**
   - Encargado de Inventario (Almacenista): stock entry/exit, tool custody, work-order tracking, disposals
   - Técnico (Especialista Naval): view assigned work orders, request parts, write technical reports

2. **Stock and inventory control**
   - Exact location tracking using military storage nomenclature
   - Entry by document (Oficio, Conduce, Factura) or direct entry
   - Critical stock alerts for fleet-essential components
   - Fast search by name, part number, or application

3. **Repair and work-order management (OTs)**
   - Unique sequential number per incoming equipment
   - Capture origin unit/ship, delivery officer data, brand/model/serial
   - Parts consumed linked to active work order
   - Work-order closure with diagnosis, replaced parts, and printable digital delivery note

4. **Tool custody**
   - Registry of workshop measurement and support tools
   - Daily loan/return tracking per technician
   - Permanent disposal/descargo for irreparable tools

5. **Transparency and audit**
   - Automatic operation log: timestamp, user, action
   - Server-side immutable audit log with IP address

## Conventions

- API base path: `/api/v1/`
- Frontend env prefix: `VITE_`
- Backend env keys: `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS`
- All destructive or sensitive operations are logged to the audit trail
- Code and comments in Spanish where they reflect domain language; core identifiers in English

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool.

- Product ideas / brainstorming → `/office-hours`
- Strategy / scope → `/plan-ceo-review`
- Architecture → `/plan-eng-review`
- Design system / plan review → `/design-consultation` or `/plan-design-review`
- Full review pipeline → `/autoplan`
- Bugs / errors → `/investigate`
- QA / testing site behavior → `/qa` or `/qa-only`
- Code review / diff check → `/review`
- Visual polish → `/design-review`
- Ship / deploy / PR → `/ship` or `/land-and-deploy`
- Save progress → `/context-save`
- Resume context → `/context-restore`
- Author a backlog-ready spec/issue → `/spec`

## Development commands

```bash
# Frontend only
npm run dev

# Backend only
cd backend && py manage.py runserver

# Database migrations
cd backend && py manage.py makemigrations && py manage.py migrate

# Create superuser
cd backend && py manage.py createsuperuser
```
