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
