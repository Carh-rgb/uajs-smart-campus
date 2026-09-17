# Pendientes / ideas para discutir en equipo

Notas dejadas durante la sesion de dockerizacion y pruebas de despliegue
(rama `feature/maicol-qa-despliegue`). No son cambios aplicados, son ideas
para que el equipo las discuta y decida si se implementan.

## Generar automaticamente el codigo estudiantil

Hoy el campo `codigoEstudiantil` (backend/services/usuarios-service/src/models/Usuario.js)
es un texto libre y opcional que el Administrador del sistema escribe a mano
al crear un usuario Estudiante. Idea propuesta por Maicol:

Generarlo automaticamente combinando:
- El numero de documento de identidad del usuario (dato que ya se pide al
  crear la cuenta, y es unico por persona).
- Iniciales del programa/facultad (ej: "ING" para Ingenieria, "SAL" para
  Ciencias de la Salud).
- El año de ingreso/registro a la universidad.

Ejemplo de formato posible: `ING-2026-1098765432` o similar (el formato
exacto queda a definir por el equipo).

Cosas a decidir en grupo antes de implementarlo:
- Formato exacto y longitud del codigo.
- Que pasa si el mismo estudiante se re-matricula otro año (¿se genera un
  codigo nuevo o se mantiene el original?).
- Si se vuelve obligatorio y unico (hoy no tiene restriccion `unique` en la
  base de datos).
- Si se genera en el frontend (Usuarios.jsx) o en el backend
  (usuarios.controller.js) al crear el usuario.
