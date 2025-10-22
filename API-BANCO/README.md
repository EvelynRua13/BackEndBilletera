# API-BANCO

Pequeña API de ejemplo para gestionar usuarios, cuentas y operaciones bancarias (depósitos, retiros, préstamos y transacciones). Este repositorio contiene el backend, pruebas unitarias y utilidades de CI.

## Requisitos

- Node.js >= 18
- npm (v9+ recomendado)

## Instalación

1. Clona el repositorio y entra en la carpeta del proyecto:

```bash
git clone <repo-url>
cd API-BANCO
```

2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` (opcional) para variables de entorno como la conexión a la base de datos. El proyecto utiliza `mysql2`.

## Scripts útiles

- `npm run dev` — Ejecuta el servidor en modo desarrollo (nodemon).
- `npm start` — Ejecuta el servidor de producción.
- `npm test` — Ejecuta Jest (modo interactivo/local).
- `npm run test:ci` — Ejecuta Jest en modo CI y genera reporte de cobertura y JUnit (usa `node --experimental-vm-modules`).
- `npm run lint` — Ejecuta ESLint.
- `npm run lint:fix` — Ejecuta ESLint y aplica correcciones automáticamente.
- `npm run format` — Formatea archivos con Prettier.

## Estructura del proyecto

- `src/`
  - `controllers/` — Endpoints y lógica de controladores.
  - `database/` — Conexión y helpers de base de datos.
  - `middlewares/` — Middlewares (auth, CORS, etc.).
  - `Rutas/` — Rutas de express.
  - `testControllers/` — Tests unitarios y mocks.
  - `utils/` — Utilidades (logger, transactionService, etc.).

## Tests y cobertura

La suite de pruebas usa Jest con `--experimental-vm-modules` para ESM. Para ejecutar las pruebas y generar reporte de cobertura:

```bash
npm run test:ci
```

Los resultados se escriben en `coverage/` y `coverage/junit.xml`.

## Contribuir

- Crea un branch por feature/bugfix.
- Añade tests para cambios de comportamiento.
- Mantén las pruebas verdes y actualiza cobertura si agregas rutas críticas.

## Notas

- Este proyecto usa ESM (campo `type: "module"` en `package.json`). Cuando mocks de módulos son necesarios en tests, las pruebas usan `jest.unstable_mockModule` y dinámicamente importan los módulos bajo prueba para asegurar que los mocks se instalen **antes** de la importación.

Si quieres, puedo:
- Añadir un `CONTRIBUTING.md` con guidelines.
- Añadir un `Makefile` o tareas npm adicionales para flujos CI.
- Añadir instrucciones específicas para configurar la base de datos local o correr con Docker.
