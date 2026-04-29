# CLAUDE.md

## Objetivo
Implementar V1 del sistema de devoluciones según arquitectura v3.

## Stack obligatorio
- Backend: NestJS + TypeScript
- Frontend: React + Vite + TypeScript
- DB: SQL Server
- ORM: Prisma
- Cache: Redis
- Queues: BullMQ
- Validación: Zod
- Estado frontend: Zustand + TanStack Query
- Estilos: Tailwind CSS

## Reglas
- No usar Express puro.
- No usar Next.js.
- No improvisar stack diferente.
- Implementar solo V1.
- Respetar el diseño de módulos del documento v3.
- No mezclar auth admin con acceso cliente por pedido+correo.
- ReturnAccessService es obligatorio.
- Antes de editar, leer README.md, AGENTS.md y docs/arquitectura_v3.md.
- Después de cada cambio:
  1. correr lint
  2. correr typecheck
  3. correr tests relacionados
  4. resumir cambios y pendientes

## Prioridad de implementación
1. Monorepo base
2. Backend NestJS base
3. Frontend React + Vite base
4. Prisma schema
5. ReturnAccessModule
6. OrdersModule + ReturnEligibilityService
7. ReturnsModule
8. EvidencesModule
9. StoresModule
10. Admin auth + RBAC
11. Admin returns
12. Notifications

## Convenciones
- TypeScript estricto
- Código modular
- DTOs y validación
- Servicios con responsabilidad única
- Prisma para acceso a datos
- Usar transacciones en operaciones críticas
- No tocar módulos no relacionados sin justificación
