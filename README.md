# Sistema de Inventario del Taller de Electrónica - Armada RD

Sistema full-stack para la gestión de inventario, órdenes de trabajo y custodia de herramientas del Taller de Electrónica de la Armada de República Dominicana.

## Tabla de contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación local](#instalación-local)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Política de ramas](#política-de-ramas)
- [Contribución](#contribución)
- [Documentación](#documentación)
- [Licencia](#licencia)

## Descripción

Este sistema permite al taller de electrónica:

- Controlar el inventario de componentes electrónicos con ubicaciones exactas y alertas de stock crítico.
- Gestionar órdenes de trabajo (OT) con numeración secuencial, asignación de técnicos, solicitud de repuestos y nota de entrega digital.
- Administrar la custodia diaria de herramientas de medición y soporte.
- Mantener una auditoría inmutable de todas las operaciones realizadas.

## Características

- **Autenticación y autorización:** JWT con tokens de 15 minutos, roles (admin, almacenista, técnico) y cierre de sesión por inactividad.
- **Inventario:** categorías, artículos, movimientos de stock, carga de imágenes, alertas de stock crítico, reportes PDF/Excel.
- **Órdenes de trabajo:** numeración `OT-YYYY-XXXXX`, solicitud/aprobación/consumo de repuestos, entrega con nota digital.
- **Herramientas:** préstamos diarios, devoluciones, bajas permanentes y detección de vencimientos.
- **Auditoría:** registro automático de creación, actualización y eliminación con usuario, IP y timestamp.
- **Búsqueda global:** barra de búsqueda con atajo `Ctrl + K`.
- **Dashboard:** estadísticas y gráficos del estado del taller.
- **Reportes:** generación de reportes en PDF y Excel para inventario, órdenes y herramientas.

## Stack tecnológico

### Backend
- Python
- Django + Django REST Framework
- Simple JWT para autenticación
- django-filter para filtros
- drf-spectacular para documentación OpenAPI
- SQLite en desarrollo / PostgreSQL en producción

### Frontend
- React 18
- Vite
- TailwindCSS
- Headless UI
- Heroicons
- Axios
- recharts (gráficos)

### Herramientas de desarrollo
- ESLint
- Prettier
- Git

## Requisitos previos

- Python 3.10+
- Node.js 18+
- npm o yarn
- Git

## Instalación local

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

El backend estará disponible en `http://127.0.0.1:8000/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173/`.

## Uso

1. Accede al frontend en el navegador.
2. Inicia sesión con el superusuario creado.
3. Desde el panel lateral navega entre Inventario, Órdenes de Trabajo, Herramientas y Auditoría.

> **Nota:** El backend en desarrollo usa SQLite. En producción configura `DATABASE_URL` para PostgreSQL y las variables de entorno de seguridad.

## Estructura del proyecto

```
.
├── backend/                 # API Django REST
│   ├── accounts/            # Usuarios, roles y autenticación JWT
│   ├── audit/               # Logs de auditoría
│   ├── config/              # Configuración de Django
│   ├── inventory/           # Inventario y movimientos de stock
│   ├── tools/               # Herramientas y préstamos
│   ├── utils/               # Utilidades (reportes)
│   ├── workorders/          # Órdenes de trabajo y repuestos
│   ├── manage.py
│   └── requirements.txt
├── frontend/                # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # Contextos (Auth)
│   │   ├── pages/           # Páginas del sistema
│   │   ├── services/        # Llamadas a la API
│   │   ├── utils/           # Utilidades
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .planning/               # Documentación de planificación
├── CLAUDE.md                # Contexto para agentes de IA
├── DESIGN.md                # Sistema de diseño
├── SPEC.md                  # Especificación funcional
└── README.md                # Este archivo
```

## Política de ramas

- **`main`**: Rama de producción / ambiente controlado. Solo se actualiza mediante Pull Requests aprobadas.
- **`develop`**: Rama de integración. Los nuevos compañeros trabajan aquí y crean Pull Requests desde sus feature branches.
- **Feature branches**: `feat/nombre-de-la-funcionalidad`, `fix/descripcion-del-bug`, `improvement/descripcion`.

### Flujo de trabajo

1. Actualiza `develop` localmente: `git pull origin develop`
2. Crea tu feature branch: `git checkout -b feat/mi-funcionalidad`
3. Realiza tus cambios y commits siguiendo el estilo del proyecto.
4. Sube tu rama: `git push origin feat/mi-funcionalidad`
5. Abre un Pull Request hacia `develop`.
6. Cuando `develop` esté estable, se fusiona a `main` mediante otro Pull Request.

## Contribución

1. Haz fork del repositorio (si corresponde).
2. Crea una rama desde `develop`.
3. Escribe código claro y sigue las convenciones existentes.
4. Asegúrate de que el backend pase sus tests: `cd backend && python manage.py test`
5. Asegúrate de que el frontend compile: `cd frontend && npm run build`
6. Abre un Pull Request con una descripción clara de los cambios.

## Documentación

- `CLAUDE.md` — Contexto y convenciones para agentes de IA.
- `DESIGN.md` — Sistema de diseño y guías visuales.
- `SPEC.md` — Especificación funcional detallada.
- `.planning/PROJECT.md` — Visión general del proyecto.
- `.planning/ROADMAP.md` — Hoja de ruta y fases completadas.
- `.planning/STATE.md` — Estado actual del proyecto.

## Licencia

Este proyecto es propiedad de la Armada de República Dominicana. Uso interno autorizado.
