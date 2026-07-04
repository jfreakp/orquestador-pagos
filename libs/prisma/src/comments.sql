-- Comentarios de negocio para pgAdmin/DBeaver (Prisma no los genera desde
-- los /// del schema.prisma). Regenerar tras cualquier cambio de schema.
-- Ejecutar con: npm run db:comments

-- ---------------------------------------------------------------------------
-- gateways
-- ---------------------------------------------------------------------------

COMMENT ON TABLE gateways IS 'Pasarela de pago integrada por el orquestador (Ahorita, Deuna, PlaceToPay). Cada gateway tiene su propia implementación de PaymentGatewayClient, seleccionada en tiempo de ejecución vía factory según su código.';
COMMENT ON COLUMN gateways.code IS 'Código corto usado para resolver la implementación (p.ej. "ahorita").';
COMMENT ON COLUMN gateways.name IS 'Nombre legible para mostrar en el panel de administración.';
COMMENT ON COLUMN gateways.is_active IS 'Si es false, el gateway no puede recibir nuevos pagos.';

-- ---------------------------------------------------------------------------
-- channels
-- ---------------------------------------------------------------------------

COMMENT ON TABLE channels IS 'Canal de origen de un pago (WEB, OFICINA, APP). Cada gateway puede tener credenciales/configuración distinta por canal.';
COMMENT ON COLUMN channels.code IS 'Código corto del canal (p.ej. "WEB").';
COMMENT ON COLUMN channels.name IS 'Nombre legible para mostrar en el panel de administración.';
COMMENT ON COLUMN channels.is_active IS 'Si es false, el canal no puede iniciar nuevos pagos.';

-- ---------------------------------------------------------------------------
-- transaction_statuses
-- ---------------------------------------------------------------------------

COMMENT ON TABLE transaction_statuses IS 'Estado del ciclo de vida de una transacción (PENDING, APPROVED, REJECTED, ERROR, REVERSED, EXPIRED).';
COMMENT ON COLUMN transaction_statuses.code IS 'Código corto del estado (p.ej. "APPROVED").';
COMMENT ON COLUMN transaction_statuses.name IS 'Nombre legible para mostrar en el panel de administración.';

-- ---------------------------------------------------------------------------
-- gateway_operation_types
-- ---------------------------------------------------------------------------

COMMENT ON TABLE gateway_operation_types IS 'Tipo de operación realizada contra un gateway (CREATE_PAYMENT, QUERY_STATUS, REFUND, AUTHORIZE_ACCESS, REFRESH_TOKEN, REVOKE_TOKEN, GENERATE_PAYMENT_LINK, PAYMENT_WEBHOOK_NOTIFICATION). Etiqueta cada entrada del historial de estados y cada error para saber qué operación los originó.';
COMMENT ON COLUMN gateway_operation_types.code IS 'Código corto de la operación (p.ej. "CREATE_PAYMENT").';
COMMENT ON COLUMN gateway_operation_types.name IS 'Nombre legible para mostrar en el panel de administración.';

-- ---------------------------------------------------------------------------
-- error_categories
-- ---------------------------------------------------------------------------

COMMENT ON TABLE error_categories IS 'Categoría de un error de transacción (COMMUNICATION, BUSINESS, INTERNAL, AUTH), usada para clasificar y filtrar fallos en el monitor.';
COMMENT ON COLUMN error_categories.code IS 'Código corto de la categoría (p.ej. "COMMUNICATION").';
COMMENT ON COLUMN error_categories.name IS 'Nombre legible para mostrar en el panel de administración.';

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------

COMMENT ON TABLE admins IS 'Usuario humano que administra el orquestador desde el panel /admin. Se autentica con usuario/contraseña vía POST /admin-auth/login, que devuelve un JWT propio (HS256, corta duración) distinto del JWT RS256 de los sistemas clientes.';
COMMENT ON COLUMN admins.username IS 'Nombre de usuario para iniciar sesión.';
COMMENT ON COLUMN admins.password_hash IS 'Hash bcrypt de la contraseña; nunca se guarda en texto plano.';
COMMENT ON COLUMN admins.is_active IS 'Si es false, el login es rechazado aunque la contraseña sea correcta.';

-- ---------------------------------------------------------------------------
-- client_systems
-- ---------------------------------------------------------------------------

COMMENT ON TABLE client_systems IS 'Sistema externo autorizado a crear pagos a través del orquestador. Se autentica con un JWT RS256 firmado con su llave privada; el orquestador solo conoce la llave pública.';
COMMENT ON COLUMN client_systems.code IS 'Código corto del sistema, usado como claim "iss" en su JWT.';
COMMENT ON COLUMN client_systems.name IS 'Nombre legible para mostrar en el panel de administración.';
COMMENT ON COLUMN client_systems.public_key IS 'Llave pública RS256 (PEM) usada para verificar la firma del JWT. La llave privada nunca se guarda aquí.';
COMMENT ON COLUMN client_systems.is_active IS 'Si es false, sus JWT son rechazados aunque la firma sea válida.';

-- ---------------------------------------------------------------------------
-- gateway_configs
-- ---------------------------------------------------------------------------

COMMENT ON TABLE gateway_configs IS 'Credenciales y configuración de un gateway para un canal específico (p.ej. credenciales de Ahorita para el canal WEB).';
COMMENT ON COLUMN gateway_configs.credentials IS 'Credenciales del gateway (clientCode, llaves PEM, merchantHash, etc.) serializadas a JSON y cifradas con AES-256-GCM a nivel de aplicación; nunca se guardan ni se exponen en texto plano.';
COMMENT ON COLUMN gateway_configs.is_active IS 'Si es false, el gateway no puede usarse en este canal.';

-- ---------------------------------------------------------------------------
-- gateway_auth_tokens
-- ---------------------------------------------------------------------------

COMMENT ON TABLE gateway_auth_tokens IS 'Token de acceso vigente frente a un gateway. Se reutiliza mientras no expire; su renovación está protegida por un advisory lock de PostgreSQL tomado por gateway (''gateway_token_'' || code) para evitar que dos requests concurrentes lo autentiquen dos veces.';
COMMENT ON COLUMN gateway_auth_tokens.access_token IS 'Token de acceso cifrado con AES-256-GCM; nunca se loguea en texto plano.';
COMMENT ON COLUMN gateway_auth_tokens.refresh_token IS 'Token de refresco cifrado; null si el gateway no soporta refresh.';
COMMENT ON COLUMN gateway_auth_tokens.expires_at IS 'Momento en que el access_token deja de ser válido.';

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

COMMENT ON TABLE transactions IS 'Un pago solicitado por un sistema cliente a través del orquestador. Registra el estado actual, los payloads intercambiados con el gateway (cifrados y en claro) y el link de cobro cuando aplica.';
COMMENT ON COLUMN transactions.public_id IS 'Identificador expuesto a sistemas clientes (GET /transactions/:publicId); distinto del id interno para no filtrar el UUID de fila real.';
COMMENT ON COLUMN transactions.idempotency_key IS 'Clave de idempotencia enviada por el sistema cliente. Junto con client_system_id forma una unique constraint: reintentos con la misma key devuelven la transacción existente sin reprocesar el pago.';
COMMENT ON COLUMN transactions.amount IS 'Monto del pago con precisión de 2 decimales.';
COMMENT ON COLUMN transactions.currency IS 'Moneda ISO del pago.';
COMMENT ON COLUMN transactions.payment_link IS 'Deeplink/URL de cobro devuelto por el gateway (p.ej. Ahorita). El QR correspondiente se regenera al vuelo a partir de este campo y no se persiste en la base de datos.';
COMMENT ON COLUMN transactions.request_encrypted IS 'Sobre cifrado del request tal cual viajó hacia el gateway.';
COMMENT ON COLUMN transactions.request_plain IS 'JSON de negocio del request ya desencriptado, para inspección/soporte.';
COMMENT ON COLUMN transactions.response_encrypted IS 'Sobre cifrado de la respuesta tal cual llegó desde el gateway.';
COMMENT ON COLUMN transactions.response_plain IS 'JSON de negocio de la respuesta ya desencriptado, para inspección/soporte.';
COMMENT ON COLUMN transactions.external_reference IS 'Identificador de la transacción en el sistema del gateway externo.';

-- ---------------------------------------------------------------------------
-- transaction_status_history
-- ---------------------------------------------------------------------------

COMMENT ON TABLE transaction_status_history IS 'Registro histórico de cada cambio de estado de una transacción, con la operación de gateway que lo originó. Permite reconstruir la línea de tiempo completa de un pago en el monitor de transacciones.';
COMMENT ON COLUMN transaction_status_history.transaction_status_id IS 'Estado al que transicionó la transacción en este punto.';
COMMENT ON COLUMN transaction_status_history.gateway_operation_type_id IS 'Operación de gateway que causó la transición; null si fue interna.';
COMMENT ON COLUMN transaction_status_history.note IS 'Detalle libre opcional (p.ej. motivo de rechazo del gateway).';

-- ---------------------------------------------------------------------------
-- transaction_errors
-- ---------------------------------------------------------------------------

COMMENT ON TABLE transaction_errors IS 'Error ocurrido durante el procesamiento de un pago o durante la autenticación de un sistema cliente, clasificado por categoría para facilitar el diagnóstico en el monitor de transacciones.';
COMMENT ON COLUMN transaction_errors.transaction_id IS 'Nullable: errores de autenticación (guard JWT) ocurren antes de que exista una transacción (p.ej. issuer desconocido o firma inválida).';
COMMENT ON COLUMN transaction_errors.error_category_id IS 'Clasificación del error (COMMUNICATION, BUSINESS, INTERNAL, AUTH).';
COMMENT ON COLUMN transaction_errors.gateway_operation_type_id IS 'Operación de gateway durante la cual ocurrió el error, si aplica.';
COMMENT ON COLUMN transaction_errors.message IS 'Mensaje de error legible para soporte/administración.';
COMMENT ON COLUMN transaction_errors.details IS 'Detalle estructurado adicional (stack trace, respuesta cruda, etc.).';

-- ---------------------------------------------------------------------------
-- gateway_webhook_events
-- ---------------------------------------------------------------------------

COMMENT ON TABLE gateway_webhook_events IS 'Notificación asíncrona (webhook) recibida de un gateway, típicamente para confirmar el resultado de un pago iniciado por link de cobro.';
COMMENT ON COLUMN gateway_webhook_events.transaction_id IS 'Transacción a la que corresponde la notificación; null si no se pudo correlacionar con ninguna transacción conocida.';
COMMENT ON COLUMN gateway_webhook_events.payload_encrypted IS 'Sobre cifrado del payload del webhook tal cual llegó del gateway.';
COMMENT ON COLUMN gateway_webhook_events.payload_plain IS 'JSON de negocio del payload ya desencriptado, para inspección/soporte.';
COMMENT ON COLUMN gateway_webhook_events.signature_valid IS 'Resultado de verificar la firma HMAC del webhook contra el secreto configurado para el gateway.';
COMMENT ON COLUMN gateway_webhook_events.processed_at IS 'Momento en que se procesó el evento; null mientras sigue pendiente.';
