# Pruebas manuales — reservas-service y recursos-service

Evidencia de las pruebas realizadas sobre `reservas-service` (puerto 4003) y
`recursos-service` (puerto 4004) para la tarea asignada en `feature/simon-reservas-recursos`:
reservar un equipo y confirmar el descuento de stock, cancelar/denegar y
confirmar la reposición, y corregir o documentar lo que falle.

Entorno: los 7 microservicios + Gateway corriendo localmente con PostgreSQL
real (una base por servicio), usando los usuarios de prueba del README raíz.

## 1. Ciclo de vida de una reserva de equipo

| Paso | Acción | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | Estudiante crea reserva de equipo (`POST /reservas`) | Estado `Pendiente`, sin tocar stock | ✅ OK |
| 2 | Administrativo confirma (`PATCH /reservas/:id/estado` → `Confirmada`) | Stock del equipo baja en 1 | ✅ OK (2 → 1) |
| 3 | Administrativo cancela la reserva confirmada (→ `Cancelada`) | Stock se repone | ✅ OK (1 → 2) |
| 4 | Repetir 1-2, luego denegar (→ `Denegada`) en vez de cancelar | Stock se repone igual que al cancelar | ✅ OK |
| 5 | Repetir 1-2, luego `DELETE /reservas/:id` sobre una reserva confirmada | Stock se repone antes de borrar | ✅ OK |
| 6 | Agotar el stock (confirmar todas las unidades) y confirmar una reserva extra | Error `400` "No hay unidades disponibles de este equipo." | ✅ OK |

## 2. Permisos por rol

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Estudiante intenta confirmar/denegar una reserva | `403` | ✅ OK |
| Estudiante intenta crear un recurso | `403` | ✅ OK |
| Estudiante lista reservas (`GET /reservas`) | Solo ve las propias | ✅ OK |
| Administrativo/Administrador lista reservas | Ve las de todos los solicitantes | ⚠️ Bug encontrado y corregido (ver abajo) |

## 3. Bug encontrado y corregido

**Síntoma:** una reserva creada por un usuario con rol `Administrativo` no
aparecía en `GET /reservas` para **nadie** que gestiona reservas —
ni para otros administrativos, ni para el `Administrador del sistema`, ni
para el propio solicitante al consultar el listado de gestión. No había
forma de verla, confirmarla, cancelarla ni consultar su historial de estado
a través del flujo normal.

**Causa:** `listar()` en `reservas.controller.js` excluía explícitamente del
`where` cualquier fila con `rolSolicitante: 'Administrativo'` para todo
usuario con rol de gestión. El microservicio hermano `solicitudes-service`
sigue el mismo patrón general (rol de gestión ve más que el propio) pero
**sin** esa exclusión — los administrativos ven todas las solicitudes sin
excepción. La exclusión en reservas era una inconsistencia frente a ese
patrón ya establecido, no un comportamiento buscado.

**Corrección:** se quitó el filtro `rolSolicitante: { [Op.ne]: 'Administrativo' }`
para que el listado de gestión se comporte igual que en `solicitudes-service`
(`where = {}` para roles administrativos). Se verificó que:
- Las reservas de un Administrativo ahora sí aparecen para todos los roles de gestión.
- Los estudiantes/docentes siguen viendo únicamente sus propias reservas (sin regresión).

## 4. Sincronización de stock desde recursos-service

| Paso | Acción | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| 1 | Crear un recurso reservable (`Audiovisual` / `Equipo de cómputo`) | Aparece en `GET /reservas/catalogo` con stock 1 | ✅ OK |
| 2 | Pasarlo a `En mantenimiento` | Stock baja a 0 en el catálogo de reservas | ✅ OK |
| 3 | Pasar directo de `En mantenimiento` a `Fuera de servicio` | No se descuenta doble (sigue en 0) | ✅ OK |
| 4 | Volver a `Disponible` | Stock repuesto a 1 | ✅ OK |
| 5 | Renombrar el recurso mientras está `Disponible` (`PATCH /recursos/:codigo`) | El stock se mueve del nombre viejo al nuevo, sin duplicar ni perder unidades | ✅ OK |
| 6 | Eliminar el recurso (única unidad) | El equipo desaparece del catálogo de reservas | ✅ OK |

## 5. Nota de documentación

El endpoint para editar nombre/tipo/ubicación de un recurso es
`PATCH /recursos/:codigo` (no `PUT`, que no existe y responde `404`).
