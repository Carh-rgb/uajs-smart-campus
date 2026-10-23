"""Genera la colección Postman del Entregable 2 (UAJS Smart Campus).

La colección se arma desde este script para que sea fácil de mantener: cada
caso es una línea con método, ruta, cuerpo y lo que se espera. Para
regenerarla después de cambiar la API:

    python3 postman/generar_coleccion.py

Salida: postman/UAJS-Smart-Campus.postman_collection.json y
postman/local.postman_environment.json (importables en Postman).
Todas las peticiones pasan por el API Gateway ({{baseUrl}} = http://localhost:4000/api).
"""
import json
import pathlib

AQUI = pathlib.Path(__file__).parent

LOGIN_TOKENS = {
    'tokenAdmin': 'admin@uajs.edu.co',
    'tokenAdministrativo': 'andres.gomez@uajs.edu.co',
    'tokenEstudiante': 'camilo.ramirez@uajs.edu.co',
    'tokenDocente': 'laura.perez@uajs.edu.co',
}


def peticion(nombre, metodo, ruta, *, token=None, cuerpo=None, esperado=200, codigo_error=None,
             guardar=None, extra=None, prueba=None, raw=None):
    """Arma un item de Postman con sus pruebas.

    esperado: status HTTP esperado. codigo_error: valor de error.code esperado.
    guardar: {'variable': 'expresion JS sobre json'} para encadenar peticiones.
    extra: lineas JS adicionales de prueba. prueba: id de la matriz (T01...).
    """
    tests = [
        f"pm.test('HTTP {esperado}', () => pm.response.to.have.status({esperado}));",
    ]
    if esperado >= 400:
        tests.append("const err = pm.response.json();")
        tests.append("pm.test('Formato de error unico', () => { pm.expect(err.success).to.eql(false); pm.expect(err.error).to.have.property('message'); });")
        if codigo_error:
            tests.append(f"pm.test('error.code = {codigo_error}', () => pm.expect(err.error.code).to.eql('{codigo_error}'));")
    elif esperado != 204:
        tests.append("const json = pm.response.json();")
    for var, expr in (guardar or {}).items():
        tests.append(f"pm.collectionVariables.set('{var}', {expr});")
    tests.extend(extra or [])

    headers = [{'key': 'Content-Type', 'value': 'application/json'}]
    if token:
        headers.append({'key': 'Authorization', 'value': f'Bearer {{{{{token}}}}}'})
    req = {
        'method': metodo,
        'header': headers,
        'url': {'raw': '{{baseUrl}}' + ruta, 'host': ['{{baseUrl}}'], 'path': [p for p in ruta.lstrip('/').split('/')]},
    }
    if '?' in ruta:
        base, query = ruta.split('?', 1)
        req['url']['path'] = [p for p in base.lstrip('/').split('/')]
        req['url']['query'] = [{'key': k, 'value': v} for k, v in (q.split('=', 1) for q in query.split('&'))]
    if cuerpo is not None or raw is not None:
        req['body'] = {'mode': 'raw', 'raw': raw if raw is not None else json.dumps(cuerpo, ensure_ascii=False, indent=2),
                       'options': {'raw': {'language': 'json'}}}
    titulo = f'[{prueba}] {nombre}' if prueba else nombre
    return {'name': titulo, 'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': tests}}], 'request': req}


def carpeta(nombre, descripcion, items):
    return {'name': nombre, 'description': descripcion, 'item': items}


FUT = '{{fechaFutura}}'
FUT2 = '{{fechaFutura2}}'

setup = carpeta('00 · Preparación', 'Inicia sesión con los 4 usuarios de prueba y calcula fechas futuras para las reservas.', [
    {
        'name': f'Login {var.replace("token", "")}',
        'event': [
            {'listen': 'prerequest', 'script': {'type': 'text/javascript', 'exec': [
                "const d = (n) => { const f = new Date(Date.now() + n * 86400000); return f.toISOString().slice(0, 10); };",
                "pm.collectionVariables.set('fechaFutura', d(10));",
                "pm.collectionVariables.set('fechaFutura2', d(11));",
            ]}},
            {'listen': 'test', 'script': {'type': 'text/javascript', 'exec': [
                "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
                f"pm.collectionVariables.set('{var}', pm.response.json().token);",
            ]}},
        ],
        'request': {
            'method': 'POST',
            'header': [{'key': 'Content-Type', 'value': 'application/json'}],
            'url': {'raw': '{{baseUrl}}/auth/login', 'host': ['{{baseUrl}}'], 'path': ['auth', 'login']},
            'body': {'mode': 'raw', 'raw': json.dumps({'correo': correo, 'password': '{{passwordPrueba}}'}), 'options': {'raw': {'language': 'json'}}},
        },
    }
    for var, correo in LOGIN_TOKENS.items()
])

recursos = carpeta('01 · Recursos (CRUD)', 'Pruebas T01 a T07 de la guía sobre recursos-service.', [
    peticion('Listar recursos', 'GET', '/recursos', token='tokenAdministrativo', prueba='T01',
             extra=["pm.test('Devuelve una coleccion', () => pm.expect(json).to.be.an('array'));"]),
    peticion('Crear recurso válido', 'POST', '/recursos', token='tokenAdministrativo', esperado=201, prueba='T02',
             cuerpo={'nombre': 'Cámara Sony Alpha', 'tipo': 'Audiovisual', 'ubicacion': 'Almacén audiovisual', 'descripcion': 'Incluye trípode'},
             guardar={'recursoCodigo': 'json.codigo'},
             extra=["pm.test('Queda Disponible y con codigo', () => { pm.expect(json.estado).to.eql('Disponible'); pm.expect(json.codigo).to.match(/^REC-/); });"]),
    peticion('Crear recurso sin nombre', 'POST', '/recursos', token='tokenAdministrativo', esperado=400, codigo_error='VALIDATION_ERROR', prueba='T03',
             cuerpo={'tipo': 'Audiovisual', 'ubicacion': 'Almacén'}),
    peticion('Crear recurso con tipo inválido', 'POST', '/recursos', token='tokenAdministrativo', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'nombre': 'X', 'tipo': 'Nave espacial', 'ubicacion': 'Almacén'}),
    peticion('Consultar recurso existente', 'GET', '/recursos/{{recursoCodigo}}', token='tokenAdministrativo', prueba='T04',
             extra=["pm.test('Datos correctos', () => pm.expect(json.nombre).to.eql('Cámara Sony Alpha'));"]),
    peticion('Consultar recurso inexistente', 'GET', '/recursos/REC-999', token='tokenAdministrativo', esperado=404, codigo_error='RESOURCE_NOT_FOUND', prueba='T05'),
    peticion('Actualizar ubicación', 'PATCH', '/recursos/{{recursoCodigo}}', token='tokenAdministrativo', prueba='T06',
             cuerpo={'nombre': 'Cámara Sony Alpha', 'tipo': 'Audiovisual', 'ubicacion': 'Laboratorio 3'},
             extra=["pm.test('Cambio persistido', () => pm.expect(json.ubicacion).to.eql('Laboratorio 3'));"]),
    peticion('Cambiar estado a uno inválido', 'PATCH', '/recursos/{{recursoCodigo}}/estado', token='tokenAdministrativo', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'estado': 'Roto'}),
    peticion('Cambiar estado a En mantenimiento', 'PATCH', '/recursos/{{recursoCodigo}}/estado', token='tokenAdministrativo',
             cuerpo={'estado': 'En mantenimiento'}, extra=["pm.test('Estado nuevo', () => pm.expect(json.estado).to.eql('En mantenimiento'));"]),
    peticion('Eliminar recurso', 'DELETE', '/recursos/{{recursoCodigo}}', token='tokenAdministrativo', esperado=204, prueba='T07'),
    peticion('Estudiante intenta crear recurso', 'POST', '/recursos', token='tokenEstudiante', esperado=403, codigo_error='FORBIDDEN',
             cuerpo={'nombre': 'X', 'tipo': 'Audiovisual', 'ubicacion': 'Y'}),
])

solicitudes = carpeta('02 · Solicitudes (ciclo de vida)', 'Pruebas T08 y T09 más el ciclo completo de estados y los permisos de lectura.', [
    peticion('Crear solicitud válida', 'POST', '/solicitudes', token='tokenEstudiante', esperado=201, prueba='T08',
             cuerpo={'tipo': 'Certificado académico', 'dependencia': 'Registro Académico', 'prioridad': 'Alta', 'descripcion': 'Certificado de notas para beca'},
             guardar={'solicitudId': 'json.id'},
             extra=["pm.test('Estado inicial Registrada', () => pm.expect(json.estado).to.eql('Registrada'));"]),
    peticion('Crear solicitud con tipo inválido', 'POST', '/solicitudes', token='tokenEstudiante', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'tipo': 'Pizza', 'dependencia': 'Registro Académico', 'descripcion': 'x'}),
    peticion('Transición inválida Registrada → Cerrada', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo',
             esperado=409, codigo_error='INVALID_TRANSITION', prueba='T09', cuerpo={'nuevoEstado': 'Cerrada', 'respuesta': 'x'}),
    peticion('Verificar que el estado no cambió', 'GET', '/solicitudes/{{solicitudId}}', token='tokenEstudiante',
             extra=["pm.test('Sigue Registrada', () => pm.expect(json.estado).to.eql('Registrada'));"]),
    peticion('Registrada → En revisión', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo',
             cuerpo={'nuevoEstado': 'En revisión', 'respuesta': 'Estamos revisando tu solicitud.'}),
    peticion('En revisión → Asignada sin responsable', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo',
             esperado=400, codigo_error='VALIDATION_ERROR', cuerpo={'nuevoEstado': 'Asignada'}),
    peticion('En revisión → Asignada con responsable', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo',
             cuerpo={'nuevoEstado': 'Asignada', 'asignadoA': 'Laura Pérez'}, extra=["pm.test('Asignada a Laura', () => pm.expect(json.asignadoA).to.eql('Laura Pérez'));"]),
    peticion('Retroceso Asignada → Registrada', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo',
             esperado=409, codigo_error='INVALID_TRANSITION', cuerpo={'nuevoEstado': 'Registrada'}),
    peticion('Asignada → En proceso', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo', cuerpo={'nuevoEstado': 'En proceso'}),
    peticion('En proceso → Resuelta', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo', cuerpo={'nuevoEstado': 'Resuelta', 'respuesta': 'Certificado emitido.'}),
    peticion('Resuelta → Cerrada', 'PATCH', '/solicitudes/{{solicitudId}}/responder', token='tokenAdministrativo', cuerpo={'nuevoEstado': 'Cerrada'}),
    peticion('Detalle con historial completo', 'GET', '/solicitudes/{{solicitudId}}', token='tokenEstudiante',
             extra=["pm.test('Historial con los 6 estados en orden', () => pm.expect(json.historial.map(h => h.estado)).to.eql(['Registrada','En revisión','Asignada','En proceso','Resuelta','Cerrada']));"]),
    peticion('Docente intenta ver la solicitud del estudiante', 'GET', '/solicitudes/{{solicitudId}}', token='tokenDocente', esperado=403, codigo_error='FORBIDDEN'),
    peticion('Solicitud inexistente', 'GET', '/solicitudes/SOL-9999', token='tokenAdministrativo', esperado=404, codigo_error='REQUEST_NOT_FOUND'),
])

reservas = carpeta('03 · Reservas (reglas de negocio)', 'Pruebas T10 y T11, validaciones de fecha y hora, existencia del espacio y modificación.', [
    peticion('Crear reserva válida', 'POST', '/reservas', token='tokenEstudiante', esperado=201, prueba='T10',
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón A01', 'fecha': FUT, 'horaInicio': '08:00', 'horaFin': '10:00', 'motivo': 'Taller de programación'},
             guardar={'reservaId': 'json.id'}, extra=["pm.test('Queda Pendiente', () => pm.expect(json.estado).to.eql('Pendiente'));"]),
    peticion('Reserva solapada en el mismo espacio', 'POST', '/reservas', token='tokenDocente', esperado=409, codigo_error='RESERVATION_CONFLICT', prueba='T11',
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón A01', 'fecha': FUT, 'horaInicio': '09:00', 'horaFin': '11:00', 'motivo': 'Clase'}),
    peticion('Franja contigua sí se permite', 'POST', '/reservas', token='tokenDocente', esperado=201,
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón A01', 'fecha': FUT, 'horaInicio': '10:00', 'horaFin': '12:00', 'motivo': 'Clase'}),
    peticion('Hora de fin antes del inicio', 'POST', '/reservas', token='tokenEstudiante', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón A02', 'fecha': FUT, 'horaInicio': '10:00', 'horaFin': '08:00', 'motivo': 'x'}),
    peticion('Fecha pasada', 'POST', '/reservas', token='tokenEstudiante', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón A02', 'fecha': '2026-01-10', 'horaInicio': '08:00', 'horaFin': '10:00', 'motivo': 'x'}),
    peticion('Espacio inexistente', 'POST', '/reservas', token='tokenEstudiante', esperado=400, codigo_error='SPACE_NOT_FOUND',
             cuerpo={'tipoEspacio': 'espacio', 'espacio': 'Salón Z99', 'fecha': FUT, 'horaInicio': '08:00', 'horaFin': '10:00', 'motivo': 'x'}),
    peticion('Reserva de equipo (consulta recursos-service)', 'POST', '/reservas', token='tokenEstudiante', esperado=201,
             cuerpo={'tipoEspacio': 'equipo', 'espacio': 'Videobeam Epson X400', 'fecha': FUT, 'horaInicio': '08:00', 'horaFin': '10:00', 'motivo': 'Exposición'}),
    peticion('Modificar a una franja ocupada', 'PATCH', '/reservas/{{reservaId}}', token='tokenEstudiante', esperado=409, codigo_error='RESERVATION_CONFLICT',
             cuerpo={'horaInicio': '09:00', 'horaFin': '11:00'}),
    peticion('Modificar a otra fecha libre', 'PATCH', '/reservas/{{reservaId}}', token='tokenEstudiante',
             cuerpo={'fecha': FUT2, 'motivo': 'Taller (reprogramado)'}, extra=["pm.test('Fecha nueva', () => pm.expect(json.fecha).to.eql(pm.collectionVariables.get('fechaFutura2')));"]),
    peticion('Otro usuario consulta la reserva', 'GET', '/reservas/{{reservaId}}', token='tokenDocente', esperado=403, codigo_error='FORBIDDEN'),
    peticion('Confirmar reserva', 'PATCH', '/reservas/{{reservaId}}/estado', token='tokenAdministrativo', cuerpo={'estado': 'Confirmada'}),
    peticion('Confirmada → Pendiente (no permitido)', 'PATCH', '/reservas/{{reservaId}}/estado', token='tokenAdministrativo',
             esperado=409, codigo_error='INVALID_TRANSITION', cuerpo={'estado': 'Pendiente'}),
    peticion('Cancelar reserva', 'PATCH', '/reservas/{{reservaId}}/estado', token='tokenAdministrativo', cuerpo={'estado': 'Cancelada'}),
    peticion('Historial de la reserva', 'GET', '/reservas/{{reservaId}}/historial', token='tokenEstudiante',
             extra=["pm.test('Pendiente → Confirmada → Cancelada', () => pm.expect(json.map(h => h.estado)).to.eql(['Pendiente','Confirmada','Cancelada']));"]),
])

usuarios = carpeta('04 · Usuarios', 'Registro público, CRUD del Administrador y validación de roles.', [
    peticion('Registro público con rol Administrador queda Estudiante', 'POST', '/auth/register', esperado=201,
             cuerpo={'nombre': 'Usuario Postman', 'correo': 'postman.{{$timestamp}}@uajs.edu.co', 'password': 'clave123', 'rol': 'Administrador del sistema'},
             extra=["pm.test('Rol forzado a Estudiante', () => pm.expect(json.usuario.rol).to.eql('Estudiante'));"]),
    peticion('Admin crea un Docente', 'POST', '/usuarios', token='tokenAdmin', esperado=201,
             cuerpo={'nombre': 'Docente Postman', 'correo': 'docente.{{$timestamp}}@uajs.edu.co', 'password': 'clave123', 'rol': 'Docente'},
             guardar={'usuarioId': 'json.id'}, extra=["pm.test('No expone passwordHash', () => pm.expect(json).to.not.have.property('passwordHash'));"]),
    peticion('Admin crea con rol inválido', 'POST', '/usuarios', token='tokenAdmin', esperado=400, codigo_error='INVALID_ROLE',
             cuerpo={'nombre': 'X', 'correo': 'x.{{$timestamp}}@uajs.edu.co', 'password': 'clave123', 'rol': 'Rey'}),
    peticion('Consultar usuario por ID', 'GET', '/usuarios/{{usuarioId}}', token='tokenAdmin'),
    peticion('Editar usuario', 'PATCH', '/usuarios/{{usuarioId}}', token='tokenAdmin', cuerpo={'nombre': 'Docente Postman Editado'},
             extra=["pm.test('Nombre actualizado', () => pm.expect(json.nombre).to.eql('Docente Postman Editado'));"]),
    peticion('Estudiante consulta otro usuario', 'GET', '/usuarios/{{usuarioId}}', token='tokenEstudiante', esperado=403, codigo_error='FORBIDDEN'),
    peticion('Eliminar usuario', 'DELETE', '/usuarios/{{usuarioId}}', token='tokenAdmin', esperado=204),
])

eventos = carpeta('05 · Eventos', 'CRUD de eventos con hora de fin e inscripción.', [
    peticion('Crear evento', 'POST', '/eventos', token='tokenAdministrativo', esperado=201,
             cuerpo={'titulo': 'Feria de proyectos', 'fecha': FUT, 'hora': '08:00', 'horaFin': '12:00', 'lugar': 'Auditorio central',
                     'ponente': 'Facultad de Ingeniería', 'facultad': 'Facultad de Ingeniería', 'cupoMaximo': 50},
             guardar={'eventoId': 'json.id'}),
    peticion('Crear evento con hora de fin inválida', 'POST', '/eventos', token='tokenAdministrativo', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'titulo': 'X', 'fecha': FUT, 'hora': '10:00', 'horaFin': '09:00', 'lugar': 'A', 'ponente': 'B', 'facultad': 'Facultad de Ingeniería'}),
    peticion('Consultar evento por ID', 'GET', '/eventos/{{eventoId}}', token='tokenEstudiante',
             extra=["pm.test('Incluye horaFin', () => pm.expect(json.horaFin).to.eql('12:00'));"]),
    peticion('Editar evento', 'PATCH', '/eventos/{{eventoId}}', token='tokenAdministrativo',
             cuerpo={'titulo': 'Feria de proyectos 2026', 'fecha': FUT, 'hora': '08:00', 'horaFin': '13:00', 'lugar': 'Auditorio central',
                     'ponente': 'Facultad de Ingeniería', 'facultad': 'Facultad de Ingeniería', 'cupoMaximo': 50}),
    peticion('Estudiante se inscribe', 'POST', '/eventos/{{eventoId}}/inscribir', token='tokenEstudiante', esperado=201),
    peticion('Inscripción duplicada', 'POST', '/eventos/{{eventoId}}/inscribir', token='tokenEstudiante', esperado=409),
    peticion('Evento inexistente', 'GET', '/eventos/99999', token='tokenEstudiante', esperado=404, codigo_error='EVENT_NOT_FOUND'),
])

# La lista espera un momento: los servicios crean las notificaciones de forma asíncrona.
lista_notificaciones = peticion('Listar mis notificaciones', 'GET', '/notificaciones', token='tokenEstudiante',
                                guardar={'notificacionId': 'json[0].id'},
                                extra=["pm.test('Hay notificaciones generadas por los servicios', () => pm.expect(json.some(n => n.titulo === 'Inscripción confirmada')).to.be.true);"])
lista_notificaciones['event'].insert(0, {'listen': 'prerequest', 'script': {'type': 'text/javascript', 'exec': ['setTimeout(() => {}, 1000);']}})

notificaciones = carpeta('06 · Notificaciones', 'Las notificaciones las generan los servicios (E2-32); aquí se consultan y se marcan como leídas.', [
    lista_notificaciones,
    peticion('Consultar notificación propia', 'GET', '/notificaciones/{{notificacionId}}', token='tokenEstudiante'),
    peticion('Otro usuario consulta la notificación', 'GET', '/notificaciones/{{notificacionId}}', token='tokenDocente', esperado=404, codigo_error='NOTIFICATION_NOT_FOUND'),
    peticion('Marcar como leída', 'PATCH', '/notificaciones/{{notificacionId}}/leida', token='tokenEstudiante',
             extra=["pm.test('leida = true', () => pm.expect(json.leida).to.be.true);"]),
    peticion('Crear notificación sin título', 'POST', '/notificaciones', token='tokenAdministrativo', esperado=400, codigo_error='VALIDATION_ERROR',
             cuerpo={'categoria': 'Institucional', 'mensaje': 'x'}),
    peticion('Usuario normal en endpoint interno', 'POST', '/notificaciones/interna', token='tokenAdmin', esperado=403, codigo_error='SERVICE_ONLY',
             cuerpo={'usuarioId': 1, 'categoria': 'Institucional', 'titulo': 'x', 'mensaje': 'y'}),
])

errores = carpeta('07 · Errores y seguridad', 'Respuestas controladas ante datos incompletos, autenticación, permisos y rutas inexistentes.', [
    peticion('Sin token', 'GET', '/recursos', esperado=401, codigo_error='UNAUTHORIZED'),
    peticion('Token inválido', 'GET', '/recursos', token='tokenFalso', esperado=401, codigo_error='UNAUTHORIZED'),
    peticion('JSON mal formado', 'POST', '/recursos', token='tokenAdministrativo', esperado=400, codigo_error='INVALID_JSON', raw='{nombre:'),
    peticion('Ruta inexistente en el Gateway', 'GET', '/no-existe', esperado=404, codigo_error='ROUTE_NOT_FOUND'),
    peticion('Ruta inexistente en un servicio', 'PUT', '/recursos/REC-001/xyz', token='tokenAdministrativo', esperado=404, codigo_error='ROUTE_NOT_FOUND'),
    peticion('Usuario intenta indexar en el buscador', 'PUT', '/buscar/documento', token='tokenEstudiante', esperado=403, codigo_error='SERVICE_ONLY',
             cuerpo={'tipo': 'solicitud', 'entidadId': 'FALSA', 'titulo': 'Resultado falso'}),
    peticion('Búsqueda global', 'GET', '/buscar?q=Feria', token='tokenEstudiante'),
])

salud = carpeta('08 · Health checks', 'Prueba T15: el Gateway consulta el /health de los 7 microservicios.', [
    {
        'name': '[T15] Health agregado del Gateway',
        'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': [
            "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
            "const json = pm.response.json();",
            "pm.test('Los 7 microservicios responden', () => { pm.expect(json.status).to.eql('ok'); pm.expect(json.microservicios).to.have.length(7); pm.expect(json.microservicios.every(m => m.ok)).to.be.true; });",
        ]}}],
        'request': {'method': 'GET', 'header': [], 'url': {'raw': '{{gatewayUrl}}/health', 'host': ['{{gatewayUrl}}'], 'path': ['health']}},
    },
])

persistencia_1 = carpeta('09 · Persistencia (antes de reiniciar)', 'T12, parte 1: crea un registro. Después se reinician los servicios y se corre la carpeta 10.', [
    peticion('Crear recurso para la prueba de persistencia', 'POST', '/recursos', token='tokenAdministrativo', esperado=201, prueba='T12',
             cuerpo={'nombre': 'Recurso persistente', 'tipo': 'Mobiliario', 'ubicacion': 'Bodega'}, guardar={'recursoPersistente': 'json.codigo'}),
])
persistencia_2 = carpeta('10 · Persistencia (después de reiniciar)', 'T12, parte 2: con los servicios reiniciados, el registro sigue en la base.', [
    peticion('Consultar el recurso tras reiniciar', 'GET', '/recursos?nombre=Recurso persistente', token='tokenAdministrativo', prueba='T12',
             extra=["pm.test('El registro sigue disponible', () => { pm.expect(json.length).to.be.at.least(1); pm.expect(json[0].nombre).to.eql('Recurso persistente'); });"]),
])
caido = carpeta('11 · Servicio caído', 'T14: con eventos-service detenido, el Gateway responde 502 controlado y el resto sigue funcionando.', [
    peticion('Eventos con el servicio detenido', 'GET', '/eventos', token='tokenEstudiante', esperado=502, codigo_error='SERVICE_UNAVAILABLE', prueba='T14'),
    peticion('Los demás servicios siguen respondiendo', 'GET', '/recursos', token='tokenAdministrativo', prueba='T14'),
])

coleccion = {
    'info': {
        'name': 'UAJS Smart Campus — Entregable 2',
        'description': (
            'Colección de pruebas del Entregable 2: CRUD de los 6 dominios, reglas de negocio, errores y seguridad, '
            'a través del API Gateway. Correr en orden (las peticiones guardan IDs en variables de la colección). '
            'Las carpetas 09/10 (T12) y 11 (T14) requieren reiniciar o detener servicios entre corridas: ver pruebas/README.md.'
        ),
        'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    'item': [setup, recursos, solicitudes, reservas, usuarios, eventos, notificaciones, errores, salud, persistencia_1, persistencia_2, caido],
    'variable': [{'key': k, 'value': ''} for k in ['recursoCodigo', 'solicitudId', 'reservaId', 'usuarioId', 'eventoId', 'notificacionId', 'recursoPersistente', 'fechaFutura', 'fechaFutura2', 'tokenFalso']],
}
for v in coleccion['variable']:
    if v['key'] == 'tokenFalso':
        v['value'] = 'esto-no-es-un-jwt'

entorno = {
    'name': 'UAJS Smart Campus — local',
    'values': [
        {'key': 'baseUrl', 'value': 'http://localhost:4000/api', 'enabled': True},
        {'key': 'gatewayUrl', 'value': 'http://localhost:4000', 'enabled': True},
        {'key': 'passwordPrueba', 'value': 'uajs2026', 'enabled': True},
    ],
}

(AQUI / 'UAJS-Smart-Campus.postman_collection.json').write_text(json.dumps(coleccion, ensure_ascii=False, indent=2) + '\n')
(AQUI / 'local.postman_environment.json').write_text(json.dumps(entorno, ensure_ascii=False, indent=2) + '\n')
total = sum(len(c['item']) for c in coleccion['item'])
print(f'Colección generada: {total} peticiones en {len(coleccion["item"])} carpetas')
