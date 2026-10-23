# Pruebas — Entregable 2

| Archivo | Qué es |
|---|---|
| [`MATRIZ-PRUEBAS.md`](MATRIZ-PRUEBAS.md) | Matriz T01–T15 de la guía con resultado obtenido y evidencia, detalle de todos los casos y defectos encontrados. |
| `matriz_pruebas.xlsx` | La misma matriz en Excel (va en `docs/` del ZIP). |
| `resultados.json` | Resumen de la última corrida: cada petición con su HTTP y sus verificaciones (sin tokens ni cuerpos). |
| `evidencias/` | Capturas de la interfaz para T13 (React → Gateway → base de datos) y T14 (servicio caído). |
| [`../postman/`](../postman/) | Colección Postman y entorno local, listos para importar. |
| `correr-pruebas.sh` / `generar_matriz.py` | Repiten las pruebas y regeneran la matriz. |

## Correr las pruebas

**En Postman:** importar `postman/UAJS-Smart-Campus.postman_collection.json` y
`postman/local.postman_environment.json`, elegir el entorno "UAJS Smart Campus —
local" y correr la colección en orden (Runner). Las peticiones guardan los IDs
que crean en variables de la colección, por eso el orden importa. Hay que
empezar con las bases recién creadas (datos de prueba originales).

**Por consola**, con el backend arriba:

```bash
bash pruebas/correr-pruebas.sh
```

El script pide reiniciar el backend antes de T12 y detener eventos-service
antes de T14, y al final regenera la matriz.

## Qué cubre la colección (75 peticiones, 12 carpetas)

| Carpeta | Pruebas |
|---|---|
| 00 · Preparación | Login de los 4 usuarios de prueba y fechas futuras para las reservas. |
| 01 · Recursos | T01–T07, tipo y estado inválidos, permisos. |
| 02 · Solicitudes | T08, T09, ciclo completo Registrada → Cerrada, retrocesos, responsable obligatorio, permisos de lectura. |
| 03 · Reservas | T10, T11, franja contigua, fechas y horas inválidas, espacio inexistente, equipo validado en recursos-service, modificación, transiciones de estado, historial. |
| 04 · Usuarios | Registro público forzado a Estudiante, CRUD del Administrador, rol inválido, permisos. |
| 05 · Eventos | CRUD con hora de fin, inscripción y duplicado. |
| 06 · Notificaciones | Notificaciones generadas por los servicios, consulta por ID, marcar leída, endpoint interno protegido. |
| 07 · Errores y seguridad | 401, JSON mal formado, rutas inexistentes, buscador protegido. |
| 08 · Health checks | T15. |
| 09 y 10 · Persistencia | T12 (antes y después de reiniciar). |
| 11 · Servicio caído | T14. |

Cada petición verifica el código HTTP y, en los errores, el formato único
`{ success: false, error: { code, message } }` y el `code` esperado.
