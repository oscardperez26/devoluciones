
SISTEMA DE GESTIÓN DE DEVOLUCIONES
Arquitectura Enterprise v3.0


NestJS · React · Vite · TypeScript · SQL Server · Redis · BullMQ
Versión
3.0.0	Estado
Aprobación	Audiencia
Equipo Tech


Cambios vs v2.0: (1) Backend migrado de Express a NestJS  (2) Frontend migrado de Next.js a React + Vite  (3) ReturnAccessService formalizado  (4) Roadmap V1/V2/V3 definido  (5) Servicios sin solapamientos  (6) Seguridad reforzada
 

1	Visión General del Sistema
Qué hace, quién lo usa, cómo se ingresa

El sistema de devoluciones permite a los clientes gestionar la devolución de productos sin crear una cuenta. El acceso es exclusivamente por número de pedido + correo electrónico. Esta decisión de diseño es intencional y se preserva en la nueva arquitectura: elimina fricción para el cliente, no requiere recordar contraseñas, y es suficiente para verificar la propiedad del pedido.

1.1  Flujo de Entrada — Pedido + Correo
ℹ  ENTRADA ÚNICA: número de pedido + correo electrónico. Sin registro, sin contraseña. El backend verifica el par, emite un token temporal firmado (ver Sección 3 — ReturnAccessService) y el cliente opera dentro de esa sesión de 2 horas.

•	El número de pedido actúa como identificador principal
•	El correo electrónico es el segundo factor de verificación de propiedad
•	Un token JWT firmado con HS256 (TTL 2h) protege las llamadas del wizard
•	El token está vinculado al par (orderId + email hash) — no es transferible entre pedidos
•	Rate limiting estricto sobre el endpoint de entrada para prevenir fuerza bruta

1.2  Actores del Sistema
Actor	Autenticación	Capacidades
Cliente final	Pedido + Correo → token temporal	Iniciar devolución, seleccionar productos y causales, subir evidencias, elegir método de entrega y reembolso, ver estado de ticket
Agente (ops)	JWT interno + rol AGENT	Ver devoluciones, cambiar estados, agregar notas internas, ver evidencias fotográficas
Supervisor	JWT interno + rol SUPERVISOR	Todo lo de Agente + métricas, exportaciones CSV/XLSX, configurar parámetros
Admin	JWT interno + rol ADMIN	Todo lo anterior + gestión de tiendas, gestión de usuarios del panel

 

2	Reglas de Negocio y Elegibilidad
La lógica que determina cuándo y cómo se puede devolver

Todas las reglas de elegibilidad están centralizadas en ReturnEligibilityService (ver Sección 5.4). Son evaluadas autoritativamente en el backend en cada operación del wizard. El frontend recibe el resultado calculado (qué causales están disponibles, cuántos días restan) y lo muestra — nunca toma decisiones de elegibilidad de forma independiente.

2.1  Condiciones Generales de Elegibilidad
⚠  Un ítem puede incluirse en una devolución solo si cumple TODAS estas condiciones simultáneamente. El backend verifica antes de cada paso del wizard.

1.	El par (orderNumber, email) existe y coincide en la base de datos
2.	El pedido tiene status = DELIVERED (not PENDING, SHIPPED, CANCELLED)
3.	El ítem específico tiene is_returnable = true
4.	El ítem no tiene una devolución activa (status IN [SUBMITTED, REVIEWING, APPROVED, PRODUCT_RECEIVED, REFUND_PROCESSING])
5.	La causal seleccionada está dentro del plazo contado desde delivered_at (o purchased_at + 7 días si delivered_at es null)
6.	La sesión de devolución (token) corresponde al mismo par (orderId, emailHash) que originó el acceso

2.2  Causales, Plazos y Evidencia
El plazo se cuenta en días calendario desde delivered_at. La validación ocurre en el servidor en el momento del POST /returns — no solo en el frontend.

Causal	Código	Plazo	Evidencia	Descripción
Demasiado pequeño	SIZE_SMALL	5 d	No	Talla inferior a la esperada
Demasiado grande	SIZE_LARGE	5 d	No	Talla superior a la esperada
No es lo que esperaba	NOT_EXPECTED	5 d	No	No coincide con descripción o foto
Retraso — ya no lo quiero	LATE_DELIVERY	5 d	No	Llegó fuera del plazo acordado
Se entregó artículo errado	WRONG_ITEM	5 d	Sí	Recibió un producto diferente al pedido
Defecto de costura	SEAM_DEFECT	30 d	Sí	Costuras rotas, descosidas o mal terminadas
Se encogió	SHRUNK	30 d	Sí	Encogió tras el primer lavado
Perdió el color	COLOR_LOSS	30 d	Sí	Decoloración o pérdida de color evidente

•	Máximo 3 causales por ítem
•	Si al menos una causal del ítem requiere evidencia → se solicitan fotos obligatorias
•	Mínimo 1 foto, máximo 5 fotos por ítem con causal de evidencia
•	Tipos permitidos: JPEG, PNG, WebP — validado por magic bytes en servidor
•	Tamaño máximo: 10 MB por archivo

2.3  Máquina de Estados de una Devolución
Estado	Código	Descripción	Transiciones permitidas
Borrador	DRAFT	Wizard en proceso, no enviado aún	→ SUBMITTED (por cliente) · borrado automático a 24h
Enviada	SUBMITTED	Cliente completó el wizard	→ REVIEWING (por agente)
En revisión	REVIEWING	Agente evaluando la solicitud	→ APPROVED, REJECTED (por agente)
Aprobada	APPROVED	Cliente debe entregar el producto	→ PRODUCT_RECEIVED (por agente)
Producto recibido	PRODUCT_RECEIVED	Producto llegó a tienda o fue recogido	→ REFUND_PROCESSING (por agente)
Procesando reembolso	REFUND_PROCESSING	Reembolso en curso	→ COMPLETED (por sistema o agente)
Completada	COMPLETED	Reembolso emitido. Estado final	— (ninguna)
Rechazada	REJECTED	No aprobada con motivo. Estado final	— (ninguna — cliente puede iniciar nueva si aún en plazo)

2.4  Métodos de Entrega y Reembolso
Concepto	Código	Detalle
Entrega en tienda	STORE	El cliente selecciona departamento → ciudad → tienda (carga dinámica vía API)
Recogida por transportadora	CARRIER	Se pre-cargan nombre y DNI del pedido. Dirección y teléfono editables.
Tarjeta regalo	GIFT_CARD	Tarjeta digital enviada al correo. Disponible en ≈ 1 día hábil.
Mercado Pago	MERCADOPAGO	Transferencia a cuenta MP asociada al correo. ≈ 2 días hábiles.
Reembolso original	ORIGINAL_PAYMENT	Crédito: siguiente/subsiguiente corte. Débito: hasta 30 d. PSE: 2 d vía MP.

2.5  Reglas de Bloqueo de Ítems
•	ítem BLOQUEADO si tiene devolución activa con status IN [SUBMITTED, REVIEWING, APPROVED, PRODUCT_RECEIVED, REFUND_PROCESSING]
•	ítem BLOQUEADO si devolución previa fue COMPLETED (ya reembolsado)
•	ítem DISPONIBLE si devolución previa fue REJECTED y la causal aún está en plazo
•	ítem NO RETORNABLE si is_returnable = false (ventas finales, temporadas liquidadas, etc.)

 

3	ReturnAccessService
El servicio central de acceso — pedido + correo sin cuenta

◆  ReturnAccessService es el núcleo de seguridad del sistema. Es el único servicio que emite y valida los tokens de sesión del wizard. Ningún otro módulo emite tokens de cliente. Toda llamada autenticada del wizard pasa por su guardia.

3.1  Responsabilidad del Servicio
ReturnAccessService tiene una única responsabilidad: verificar que un par (orderNumber, email) corresponde a un pedido real del sistema, y emitir un token de sesión temporal que autoriza al portador a operar el wizard para ese pedido específico. No autentica usuarios internos — eso es responsabilidad de AuthService.

3.2  Estructura del Token (Claims)
JWT claims del token de sesión de devolución
// JWT payload — firmado con HS256 usando RETURN_ACCESS_SECRET
{
  // Claims estándar
  "iss": "returns-api",           // issuer: identifica el sistema
  "sub": "order:{orderId}",       // subject: ID interno del pedido
  "iat": 1719530000,              // issued at: timestamp Unix
  "exp": 1719537200,              // expiry: iat + 7200 (2 horas fijas)
  "jti": "uuid-v4",              // JWT ID: único por token, para revocación puntual

  // Claims privados del dominio
  "orderId":   "uuid-del-pedido", // FK interna — nunca el orderNumber externo
  "emailHash": "sha256(email.toLowerCase().trim())",  // hash del correo, no el correo en texto
  "scope":     "return:write",    // permiso explícito para operaciones del wizard
  "returnId":  "uuid | null",     // si ya existe un borrador activo, se incluye
}

⚠  El correo NO se almacena en el token — solo su hash SHA-256. Esto protege el dato sensible en caso de que el token sea interceptado o loggeado accidentalmente.

3.3  Flujo Completo de Emisión y Validación
ReturnAccessService — flujo completo
// ── PASO 1: Cliente envía pedido + correo ──────────────────────────────────
POST /api/v1/access/start
{ "orderNumber": "10045", "email": "cliente@mail.com" }

// ── PASO 2: ReturnAccessService.verifyAndIssue() ───────────────────────────
1. Rate limit check: max 5 intentos por IP en 15 minutos (Redis INCR + TTL)
2. Rate limit check: max 3 intentos por orderNumber en 15 minutos
3. Normalizar email: toLowerCase().trim()
4. Calcular emailHash: crypto.createHash('sha256').update(normalizedEmail).digest('hex')
5. Query: SELECT id, status FROM orders WHERE order_number=$1 AND customer_email_hash=$2
6. Si no existe → 404 con mensaje genérico (no revelar si el pedido existe)
7. Si status = CANCELLED → 422 'El pedido está cancelado y no acepta devoluciones'
8. Si status != DELIVERED → 422 'El pedido aún no ha sido entregado'
9. Generar jti = uuid v4
10. Firmar JWT con HS256 + RETURN_ACCESS_SECRET
11. Guardar jti en Redis: SET return:session:{jti} '1' EX 7200
12. Registrar evento en audit_log: { action: 'SESSION_STARTED', orderId, ip, userAgent }
13. Retornar { sessionToken, order: { id, orderNumber, customerName, deliveredAt } }

// ── PASO 3: Validación en cada request del wizard (ReturnAccessGuard) ──────
1. Extraer token del header: Authorization: Bearer {token}
2. Verificar firma JWT (HS256 + secret) → si falla: 401
3. Verificar exp → si expirado: 401 con code SESSION_EXPIRED
4. Verificar jti en Redis: EXISTS return:session:{jti} → si 0: 401 SESSION_REVOKED
5. Inyectar { orderId, emailHash, returnId } en req.accessContext
6. El controlador usa accessContext — nunca params del body para identificar el pedido

3.4  Protecciones Anti-abuso
Amenaza	Control	Implementación
Fuerza bruta (email/pedido)	Rate limit por IP	5 intentos / 15 min por IP. Redis INCR con TTL. 429 + Retry-After header.
Enumeración de pedidos	Rate limit por orderNumber	3 intentos / 15 min por número de pedido independientemente de la IP.
Respuesta oráculo	Mensaje genérico	Siempre '404 No encontramos ese pedido' — nunca revelar si el número existe pero el email es incorrecto.
Token robado / compartido	Revocación por jti	Al hacer logout o al detectar uso anómalo, DEL return:session:{jti} en Redis invalida el token inmediatamente.
Reutilización entre pedidos	orderId en claims	El ReturnAccessGuard verifica que el orderId del token coincida con el recurso solicitado en la URL.
Sesión abierta para siempre	TTL fijo 2h	El token expira a las 2 horas sin excepción. No hay refresh de token de sesión de devolución.
Token válido en producción filtrado	emailHash en claims	Sin el email original no es posible derivar el hash — un token interceptado no revela el correo del cliente.

3.5  Módulo NestJS — ReturnAccessModule
ReturnAccessModule — estructura NestJS
// src/modules/return-access/return-access.module.ts
@Module({
  imports: [PrismaModule, RedisModule, AuditModule],
  controllers: [ReturnAccessController],
  providers: [ReturnAccessService, ReturnAccessGuard],
  exports: [ReturnAccessGuard],  // otros módulos importan el guard
})
export class ReturnAccessModule {}

// src/modules/return-access/return-access.controller.ts
@Controller('access')
@UseGuards(IpRateLimitGuard)
export class ReturnAccessController {
  @Post('start')
  @Throttle(5, 900)  // 5 req / 15 min por IP
  async start(@Body() dto: StartAccessDto): Promise<AccessResponseDto> {
    return this.returnAccessService.verifyAndIssue(dto);
  }
}

// DTO con validación Zod/class-validator
class StartAccessDto {
  @IsString() @Length(1, 50) orderNumber: string;
  @IsEmail() email: string;
}

 

4	Arquitectura NestJS — Backend
Módulos, controladores, servicios y estructura real de carpetas

El backend usa NestJS con su arquitectura de módulos, que alinea perfectamente con el diseño de dominio del sistema. Cada dominio (orders, returns, stores, etc.) es un módulo independiente con su propio controlador, servicio y repositorio. Los módulos se conectan mediante inyección de dependencias — no hay imports circulares.

4.1  Estructura Real de Carpetas — Backend (NestJS)
Estructura de carpetas — NestJS backend
apps/api/src/
├── main.ts                          # Bootstrap: NestFactory, Helmet, CORS, ValidationPipe
├── app.module.ts                    # Módulo raíz — importa todos los feature modules
├── config/
│   ├── config.module.ts             # ConfigModule.forRoot() con validación Zod
│   └── env.schema.ts                # Zod schema de variables de entorno
│
├── modules/
│   ├── return-access/               # Sesión pedido+correo → token temporal
│   │   ├── return-access.module.ts
│   │   ├── return-access.controller.ts  # POST /access/start
│   │   ├── return-access.service.ts     # verifyAndIssue(), revokeSession()
│   │   ├── return-access.guard.ts       # ReturnAccessGuard (valida token wizard)
│   │   └── dto/
│   │       ├── start-access.dto.ts
│   │       └── access-response.dto.ts
│   │
│   ├── orders/                      # Pedidos: lookup, ítems, elegibilidad
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts     # GET /session/order
│   │   ├── orders.service.ts        # getOrderWithItems()
│   │   ├── orders.repository.ts     # Queries Prisma de orders
│   │   └── return-eligibility/
│   │       └── return-eligibility.service.ts  # isEligible(), getEligibleReasons()
│   │
│   ├── returns/                     # Devoluciones: wizard completo
│   │   ├── returns.module.ts
│   │   ├── returns.controller.ts
│   │   │   # POST /returns
│   │   │   # POST /returns/:id/items
│   │   │   # PATCH /returns/:id/delivery
│   │   │   # PATCH /returns/:id/refund-method
│   │   │   # POST /returns/:id/submit
│   │   ├── returns.service.ts       # Orquesta el wizard
│   │   ├── returns.repository.ts    # Queries Prisma de returns
│   │   └── dto/
│   │
│   ├── evidences/                   # Evidencias fotográficas
│   │   ├── evidences.module.ts
│   │   ├── evidences.controller.ts  # POST /returns/:id/evidences/upload-url
│   │   │                            # POST /returns/:id/evidences/confirm
│   │   └── evidences.service.ts     # generatePresignedUrl(), confirmUpload()
│   │
│   ├── stores/                      # Tiendas: búsqueda geográfica
│   │   ├── stores.module.ts
│   │   ├── stores.controller.ts     # GET /stores (público, cacheado)
│   │   └── stores.service.ts        # getDepartments(), getCities(), getStores()
│   │
│   ├── notifications/               # Emails async via BullMQ
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts # enqueueEmail()
│   │   └── workers/
│   │       └── email.worker.ts      # Procesa cola con Resend
│   │
│   ├── admin/                       # Panel operaciones (auth interna)
│   │   ├── admin.module.ts
│   │   ├── admin-returns.controller.ts
│   │   ├── admin-stores.controller.ts
│   │   ├── admin-metrics.controller.ts
│   │   └── admin.service.ts
│   │
│   └── webhooks/                    # Shopify, MercadoPago
│       ├── webhooks.module.ts
│       ├── webhooks.controller.ts
│       └── webhooks.service.ts
│
├── infrastructure/
│   ├── database/
│   │   ├── prisma.module.ts         # PrismaService global
│   │   └── prisma.service.ts
│   ├── cache/
│   │   ├── redis.module.ts          # Redis global (ioredis)
│   │   └── redis.service.ts
│   ├── queue/
│   │   └── bullmq.module.ts         # Queues: email, evidence-processing
│   └── storage/
│       └── s3.service.ts            # Pre-signed URLs, delete, copy
│
├── common/
│   ├── guards/
│   │   ├── admin-jwt.guard.ts       # JWT interno para panel admin
│   │   └── roles.guard.ts           # RBAC guard
│   ├── decorators/
│   │   ├── access-context.decorator.ts  # @AccessContext() inyecta orderId, emailHash
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Formato de error estándar
│   ├── interceptors/
│   │   ├── response-envelope.interceptor.ts  # Envuelve { success, data, meta }
│   │   └── audit.interceptor.ts
│   └── pipes/
│       └── zod-validation.pipe.ts   # ValidationPipe usando Zod
│
└── audit/
    ├── audit.module.ts
    └── audit.service.ts             # log(action, context, metadata)

4.2  Cómo se Conectan los Módulos
Conexión entre módulos y flujo de request
// app.module.ts — módulo raíz
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // variables de entorno disponibles en todo
    PrismaModule,        // global — todos los módulos pueden inyectar PrismaService
    RedisModule,         // global — disponible en guards, services, workers
    BullMQModule,        // registra las colas email-queue, evidence-queue
    ReturnAccessModule,  // exporta ReturnAccessGuard
    OrdersModule,        // importa ReturnAccessGuard para proteger GET /session/order
    ReturnsModule,       // importa ReturnAccessGuard, OrdersModule, EvidencesModule
    EvidencesModule,     // importa ReturnAccessGuard, S3Service
    StoresModule,        // sin guards — endpoints públicos con caché Redis
    NotificationsModule, // sin controller — solo workers BullMQ
    AdminModule,         // importa AdminJwtGuard, RolesGuard
    WebhooksModule,      // protegido por HmacGuard (no JWT)
    AuditModule,         // global — todos los módulos pueden inyectar AuditService
  ],
})
export class AppModule {}

// Flujo de una request del wizard (ejemplo: POST /returns)
Request → GlobalMiddleware (Helmet, CORS, logger) →
  → ReturnAccessGuard (verifica JWT, consulta Redis, inyecta accessContext) →
    → ZodValidationPipe (valida body) →
      → ReturnsController.create() →
        → ReturnsService.createDraft(orderId, items) →
          → ReturnEligibilityService.validateItems(orderId, items) →
          → ReturnsRepository.upsertDraft(returnData) →
          → AuditService.log('RETURN_DRAFT_CREATED', context) →
        ← ReturnsController ← ResponseEnvelopeInterceptor wraps response

4.3  main.ts — Bootstrap
main.ts — configuración del servidor
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: PinoLogger,  // logs estructurados JSON para producción
  });

  // Seguridad HTTP
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGINS.split(','), credentials: true });

  // Validación global
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // Versionado de API
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });  // /api/v1/...

  // Documentación OpenAPI
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Returns API').setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT || 3000);
}

 

5	Definición de Servicios
Responsabilidades concretas sin solapamientos

Cada servicio tiene una responsabilidad única y bien delimitada. Las fronteras están diseñadas para que no existan solapamientos: si una lógica puede vivir en más de un servicio, esta sección define dónde vive y cómo los demás la consumen.

5.1  ReturnAccessService
•	Único responsable de: verificar el par (orderNumber, email) y emitir/revocar tokens de sesión de wizard
•	Método principal: verifyAndIssue(orderNumber, email) → { sessionToken, orderSnapshot }
•	Método secundario: revokeSession(jti) → elimina key de Redis
•	NO HACE: lógica de negocio de devoluciones, consulta de ítems, estados
•	Dependencias: PrismaService (solo orders), RedisService, AuditService

5.2  OrderService
•	Único responsable de: retornar el snapshot completo de un pedido con sus ítems para el wizard
•	Método principal: getOrderWithEligibility(orderId) → { order, items: ItemWithEligibility[] }
•	Consulta orders JOIN order_items e invoca ReturnEligibilityService por cada ítem
•	NO HACE: crear ni modificar pedidos del wizard — eso es ReturnsService. Tampoco emite tokens.
•	Dependencias: PrismaService, ReturnEligibilityService, RedisService (caché de ítems)

5.3  ReturnEligibilityService
•	Único responsable de: calcular si un ítem puede ser devuelto y con qué causales, dado el estado actual del sistema
•	Método: getItemEligibility(orderItem, existingReturns, today) → EligibilityResult
•	Contiene: reglas de plazos por causal, reglas de bloqueo, flag is_returnable, lógica de días transcurridos
•	Es una función pura: recibe datos, devuelve resultado. No tiene efectos secundarios, no llama a BD.
•	NO HACE: guardar en BD, emitir emails, verificar tokens
•	Al ser pura, es fácilmente testeable con Vitest: sin mocks de BD, sin setup de Redis

5.4  ReturnsService
•	Único responsable de: orquestar el wizard completo: crear borrador, añadir ítems, actualizar datos, finalizar
•	Método: createOrUpdateDraft(accessContext, itemsDto) → ReturnDraft
•	Método: setDeliveryMethod(returnId, deliveryDto) → Return
•	Método: setRefundMethod(returnId, refundMethod) → Return
•	Método: submit(returnId) → SubmittedReturn — genera ticket, cambia status, dispara notificación
•	Verifica que returnId pertenece al orderId del accessContext antes de cualquier operación
•	NO HACE: verificar elegibilidad (ReturnsEligibilityService), enviar emails (NotificationService), subir archivos (EvidenceService)
•	Dependencias: PrismaService, ReturnsRepository, ReturnEligibilityService, NotificationService, AuditService, TicketService

5.5  EvidenceService
•	Único responsable de: gestionar el ciclo de vida de los archivos de evidencia fotográfica
•	Método: generateUploadUrl(returnItemId, fileName, mimeType) → { uploadUrl, fileKey }
•	Método: confirmUpload(returnItemId, fileKey, fileSizeBytes) → Evidence
•	Valida mimeType contra whitelist [image/jpeg, image/png, image/webp]
•	Verifica magic bytes del archivo en S3 tras la confirmación (head-object + primer chunk)
•	Encola procesamiento asíncrono: redimensionado WebP + escaneo básico
•	NO HACE: cambiar el estado de la devolución, enviar notificaciones, acceder a datos del pedido más allá del returnItemId

5.6  NotificationService
•	Único responsable de: encolar y enviar emails transaccionales. Nunca envía de forma síncrona.
•	Método: enqueue(type: EmailType, payload: EmailPayload) → void (solo encola, no espera)
•	Workers BullMQ procesan la cola y llaman a Resend. Reintentos automáticos con backoff.
•	Tipos soportados: RETURN_CONFIRMED, STATUS_UPDATED, REFUND_PROCESSED, EXPORT_READY
•	Registra cada envío en notification_logs (delivered, bounced, opened vía webhook Resend)
•	NO HACE: conocer la lógica de negocio de cuándo enviar — eso decide quien lo llama. NotificationService solo envía lo que le piden.

5.7  RefundService (V2)
•	Único responsable de: registrar y coordinar la emisión de reembolsos. Entra en V2.
•	En V1: el agente cambia el estado manualmente a COMPLETED. No hay integración automática.
•	En V2: conecta con MercadoPago API para emitir reembolsos programáticamente.
•	Método (V2): initiateRefund(returnId, method, amount) → RefundTransaction
•	Método (V2): processWebhookConfirmation(payload) → actualiza status a COMPLETED
•	NO HACE: gestionar el estado de la devolución (ReturnsService), enviar emails (NotificationService)

5.8  AuditService
•	Único responsable de: registrar de forma inmutable cada acción con efecto de escritura en el sistema
•	Método: log(action, context, metadata?) → void (no bloquea el flujo — fire and forget con cola interna)
•	Campos mínimos: action (string), actorId (userId o 'customer:orderId'), ip, userAgent, timestamp, resourceId, resourceType
•	Solo escribe, nunca lee — los reportes de auditoría los hace AdminService consultando la tabla directamente
•	NO HACE: tomar decisiones de negocio, enviar alertas, verificar permisos

5.9  Mapa de Dependencias entre Servicios
ℹ  Leer de arriba hacia abajo: cada servicio en la columna izquierda PUEDE llamar a los servicios de la columna derecha. Los servicios de infraestructura (Prisma, Redis, S3) son inyectados directamente.

Servicio	Puede depender de
ReturnAccessService	PrismaService · RedisService · AuditService
OrderService	PrismaService · ReturnEligibilityService · RedisService
ReturnEligibilityService	(ninguna — función pura, opera sobre datos ya cargados)
ReturnsService	PrismaService · ReturnEligibilityService · NotificationService · AuditService · TicketService
EvidenceService	PrismaService · S3Service · AuditService
NotificationService	BullMQ (encola) — el worker usa ResendClient
RefundService (V2)	PrismaService · MercadoPagoClient · NotificationService · AuditService
AuditService	PrismaService (solo INSERT — tabla append-only)
AdminService	PrismaService · NotificationService · AuditService · S3Service (exports)

 

6	Contratos de API
Endpoints listos para implementar con request y response

Todos los endpoints devuelven el envelope: { "success": boolean, "data": any, "meta": { "timestamp": string, "requestId": string } }

6.1  Módulo Access (ReturnAccessService)
Método	Endpoint	Auth	Descripción
POST	/api/v1/access/start	Público + Rate Limit	Verifica pedido+correo, emite sessionToken JWT (2h)

POST /access/start — request y responses
// POST /api/v1/access/start
// Request
{ "orderNumber": "10045", "email": "cliente@mail.com" }

// Response 200
{
  "success": true,
  "data": {
    "sessionToken": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresAt": "2025-06-28T16:00:00Z",
    "order": {
      "id": "uuid", "orderNumber": "10045",
      "customerName": "Juan Pérez",
      "purchasedAt": "2025-06-01T10:00:00Z",
      "deliveredAt": "2025-06-05T14:30:00Z"
    }
  }
}

// Response 404 — siempre el mismo mensaje (no revela si el pedido existe)
{ "success": false, "error": { "code": "ORDER_NOT_FOUND",
  "message": "No encontramos un pedido con ese número y correo." } }

// Response 429 — rate limit
{ "success": false, "error": { "code": "TOO_MANY_ATTEMPTS",
  "message": "Demasiados intentos. Intenta de nuevo en 15 minutos." } }

6.2  Módulo Orders
Método	Endpoint	Auth	Descripción
GET	/api/v1/session/order	sessionToken	Retorna ítems del pedido con elegibilidad calculada por ítem

GET /session/order — response con elegibilidad
// GET /api/v1/session/order
// Header: Authorization: Bearer {sessionToken}

// Response 200
{
  "success": true,
  "data": {
    "order": { "id":"uuid", "orderNumber":"10045", "deliveredAt":"2025-06-05T14:30:00Z" },
    "items": [
      {
        "id": "item-uuid",
        "sku": "CAM-001-M",
        "productName": "Camisa Slim Fit Blanca",
        "size": "M", "color": "Blanco",
        "unitPrice": 92500,
        "imageUrl": "https://cdn.empresa.com/cam-001.jpg",
        "isReturnable": true,
        "returnStatus": null,
        "eligibleReasons": [
          { "code":"SIZE_SMALL",   "label":"Demasiado pequeño",  "requiresEvidence":false, "daysLeft":3 },
          { "code":"SEAM_DEFECT", "label":"Defecto de costura", "requiresEvidence":true,  "daysLeft":28 }
        ],
        "blockedReason": null
      }
    ]
  }
}

6.3  Módulo Returns — Wizard completo
Método	Endpoint	Auth	Descripción
POST	/api/v1/returns	sessionToken	Crea borrador con ítems + causales (upsert por orden)
POST	/api/v1/returns/:id/evidences/upload-url	sessionToken	Obtiene URL firmada para subir foto directo a S3
POST	/api/v1/returns/:id/evidences/confirm	sessionToken	Confirma upload. Valida magic bytes. Guarda en BD.
PATCH	/api/v1/returns/:id/delivery	sessionToken	Establece método de entrega (tienda o transportadora)
PATCH	/api/v1/returns/:id/refund-method	sessionToken	Establece método de reembolso
POST	/api/v1/returns/:id/submit	sessionToken	Finaliza wizard. Genera ticket. Dispara email. Idempotente.

Returns — requests y responses clave
// POST /api/v1/returns — crear/actualizar borrador
{
  "items": [
    {
      "orderItemId": "item-uuid",
      "reasonCodes": ["SIZE_SMALL"],
      "comments": "Me quedó pequeña la talla M.",
      "quantity": 1
    }
  ]
}
// Response 201
{ "returnId":"uuid", "status":"DRAFT", "totalRefund":92500,
  "items":[{ "id":"ri-uuid","requiresEvidence":false,"unitRefund":92500 }] }

// PATCH /api/v1/returns/:id/delivery — tienda
{ "method": "STORE", "storeId": "store-uuid" }

// PATCH /api/v1/returns/:id/delivery — transportadora
{ "method": "CARRIER",
  "address": { "fullName":"Juan Pérez","address":"Cra 15 #93-47","city":"Bogotá",
               "department":"Cundinamarca","phone":"3001234567","documentId":"12345678" } }

// POST /api/v1/returns/:id/submit
{ }  // body vacío — toda la info ya está en el borrador
// Response 200
{ "ticketNumber":"DV-20250628-0042","status":"SUBMITTED","totalRefund":92500,
  "confirmationEmail":"cli***@gmail.com","estimatedReviewDays":3 }

6.4  Módulo Stores
Método	Endpoint	Auth	Descripción
GET	/api/v1/stores/departments	Público / Redis TTL 1h	Lista de departamentos únicos con tiendas activas
GET	/api/v1/stores/cities?department=X	Público / Redis TTL 1h	Ciudades del departamento
GET	/api/v1/stores?department=X&city=Y	Público / Redis TTL 1h	Tiendas con nombre, dirección, teléfono, horarios

6.5  Panel Admin (JWT interno + Rol)
Método	Endpoint	Rol	Descripción
GET	/api/v1/admin/returns	AGENT	Listado paginado. Filtros: status, dateFrom, dateTo, search.
GET	/api/v1/admin/returns/:id	AGENT	Detalle completo: ítems, evidencias (URLs firmadas), historial de estados
PATCH	/api/v1/admin/returns/:id/status	AGENT	Cambia estado. Body: { status, notes }. Dispara email automático.
GET	/api/v1/admin/returns/:id/timeline	AGENT	Historial cronológico de cambios de estado con notas
POST	/api/v1/admin/returns/export	SUPERVISOR	Inicia exportación async. Retorna jobId. Email con link cuando listo.
GET	/api/v1/admin/metrics	SUPERVISOR	KPIs: volumen, tasa aprobación, tiempo promedio, top causales
POST	/api/v1/admin/stores	ADMIN	Crea tienda. Invalida caché Redis de tiendas.
PUT	/api/v1/admin/stores/:id	ADMIN	Actualiza tienda. Invalida caché.

 

7	Frontend — React + Vite
Estructura real, rutas, estado, diseño fiel al original

◆  El frontend usa React 18 + Vite (no Next.js). Sin SSR, sin Server Components. Es una SPA pura que se sirve desde un CDN o servidor estático. El wizard del cliente y el panel admin son dos áreas separadas dentro del mismo proyecto Vite.

7.1  Estructura de Carpetas — Frontend (React + Vite)
Estructura de carpetas — React + Vite
apps/web/
├── index.html                  # Entry point Vite
├── vite.config.ts              # Config: proxy /api → backend, alias @/
├── tailwind.config.ts
├── src/
│   ├── main.tsx                # ReactDOM.createRoot, BrowserRouter, QueryClientProvider
│   ├── App.tsx                 # Routes: / (wizard) y /admin/* (panel)
│   │
│   ├── pages/
│   │   ├── wizard/             # Flujo del cliente (sin auth)
│   │   │   ├── Step1Entry.tsx  # Pedido + Correo
│   │   │   ├── Step2Products.tsx
│   │   │   ├── Step3Agreement.tsx
│   │   │   ├── Step4Delivery.tsx
│   │   │   ├── Step5Refund.tsx
│   │   │   └── Confirmation.tsx
│   │   └── admin/              # Panel de operaciones (requiere auth)
│   │       ├── Login.tsx
│   │       ├── Dashboard.tsx
│   │       ├── ReturnsList.tsx
│   │       ├── ReturnDetail.tsx
│   │       ├── Metrics.tsx
│   │       └── StoresManager.tsx
│   │
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── StepIndicator.tsx   # Barra de pasos 1●2●3○4○5
│   │   │   ├── ProductCard.tsx     # Tarjeta de producto con estado
│   │   │   ├── ReasonModal.tsx     # Modal selección de causales
│   │   │   ├── EvidenceUpload.tsx  # Dropzone + preview + upload S3
│   │   │   ├── StorePicker.tsx     # Cascada departamento→ciudad→tienda
│   │   │   ├── ReturnSummary.tsx   # Panel lateral resumen (sticky)
│   │   │   └── RefundOption.tsx    # Tarjeta método de reembolso
│   │   ├── admin/
│   │   │   ├── ReturnTable.tsx     # Tabla con filtros y paginación
│   │   │   ├── StatusBadge.tsx     # Badge de estado con colores
│   │   │   ├── StatusTimeline.tsx  # Historial visual de cambios
│   │   │   └── MetricsCard.tsx
│   │   └── ui/                 # shadcn/ui base components
│   │
│   ├── store/
│   │   ├── wizard.store.ts     # Zustand: sessionToken, orderId, returnId, pasos
│   │   └── admin.store.ts      # Zustand: filtros de tabla, estado UI
│   │
│   ├── api/
│   │   ├── client.ts           # Instancia Axios/fetch con interceptores
│   │   ├── access.api.ts       # startSession(orderNumber, email)
│   │   ├── orders.api.ts       # getSessionOrder()
│   │   ├── returns.api.ts      # createReturn(), submitReturn(), etc.
│   │   ├── stores.api.ts       # getDepartments(), getCities(), getStores()
│   │   └── admin.api.ts        # getReturns(), updateStatus(), etc.
│   │
│   ├── hooks/
│   │   ├── useWizard.ts        # Lógica de navegación entre pasos
│   │   ├── useEvidenceUpload.ts # Upload S3 presigned con progreso
│   │   └── useStoreSearch.ts   # Manejo de la cascada de tiendas
│   │
│   └── types/
│       └── index.ts            # Re-exports del package shared
│
└── public/
    └── assets/                 # Logo, favicon

7.2  Routing con React Router v6
App.tsx — routing completo
// src/App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wizard público — sin autenticación */}
        <Route path='/' element={<Step1Entry />} />
        <Route path='/paso-2' element={<RequireSession><Step2Products /></RequireSession>} />
        <Route path='/paso-3' element={<RequireSession><Step3Agreement /></RequireSession>} />
        <Route path='/paso-4' element={<RequireSession><Step4Delivery /></RequireSession>} />
        <Route path='/paso-5' element={<RequireSession><Step5Refund /></RequireSession>} />
        <Route path='/confirmacion' element={<Confirmation />} />

        {/* Panel admin — requiere JWT interno */}
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route path='/admin' element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
          <Route index element={<Dashboard />} />
          <Route path='devoluciones' element={<ReturnsList />} />
          <Route path='devoluciones/:id' element={<ReturnDetail />} />
          <Route path='metricas' element={<Metrics />} />
          <Route path='tiendas' element={<StoresManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// RequireSession: si no hay sessionToken en Zustand → redirect a /
// RequireAdminAuth: si no hay adminJwt en localStorage → redirect a /admin/login

7.3  Estado del Wizard (Zustand)
Zustand store del wizard
// src/store/wizard.store.ts
interface WizardState {
  sessionToken: string | null;
  expiresAt: string | null;
  orderId: string | null;
  returnId: string | null;
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedItems: SelectedItem[];   // ítems con causales y evidencias
  deliveryMethod: 'STORE' | 'CARRIER' | null;
  refundMethod: RefundMethod | null;

  // Actions
  setSession: (token: string, expiresAt: string, orderId: string) => void;
  setReturnId: (id: string) => void;
  addItem: (item: SelectedItem) => void;
  removeItem: (orderItemId: string) => void;
  setDelivery: (method: DeliveryData) => void;
  setRefund: (method: RefundMethod) => void;
  goToStep: (step: number) => void;
  reset: () => void;   // limpia todo — usado en Confirmación
}

// NOTA: sessionToken NO se persiste en localStorage.
// Al recargar la página, el cliente vuelve al Paso 1.
// Esto es intencional: protege el token y simplifica la gestión de sesión.

7.4  Diseño — Tokens Visuales y Fidelidad al Original
ℹ  El nuevo frontend replica exactamente el look & feel del proyecto original: fondo de imagen de moda con overlay oscuro, tarjeta blanca centrada con sombra, barra de pasos numerada negra, botones oscuros. Implementado con Tailwind CSS.

Token	Valor	Uso / referencia al original
color.primary	#111827	Botones principales, barra de pasos activa — igual al original
color.accent	#4F46E5	Botón del Paso 1 (index.html original usa #4f46e5)
color.success	#16A34A	Ítems seleccionados, confirmación, borde verde en tarjeta completa
color.warning	#D97706	Causales con días limitados, alertas de plazo
color.error	#DC2626	Errores de validación, ítems bloqueados
color.surface	#FFFFFF	Fondo de tarjetas y modales — igual al original
color.pageBg	#F9FAFB	Fondo páginas internas
radius.card	16px	Tarjeta principal — igual al original (border-radius: 16px)
radius.button	8px	Botones — igual al original
radius.chip	9999px	Pills de causales
shadow.card	0 10px 30px rgba(0,0,0,0.2)	Sombra tarjeta — igual al original
font.family	'Inter', sans-serif	Tipografía — igual al original
overlay.bg	rgba(0,0,0,0.5)	Overlay del fondo — igual al body::before del original

 

8	Seguridad — Controles Detallados por Capa
Acceso pedido+correo, tokens, uploads, panel admin

8.1  Capa de Acceso por Pedido + Correo
Control	Valor / Configuración	Implementación
Rate limit por IP	5 intentos / 15 min	Redis INCR con EXPIRE. Header 429 con Retry-After. ThrottlerModule de NestJS.
Rate limit por orderNumber	3 intentos / 15 min	Clave Redis: ratelimit:order:{sha256(orderNumber)}. Independiente del rate limit de IP.
Mensaje de error genérico	Siempre el mismo 404	Nunca distinguir 'pedido no existe' de 'email incorrecto' — evita enumeración.
Email normalizado antes de comparar	toLowerCase().trim()	Evita bypass por variaciones de mayúsculas o espacios en el correo.
Email hasheado en BD	SHA-256 del email	La tabla orders guarda customer_email_hash, no el email en texto (opcional en V2, recomendado).
Registro de intentos fallidos	audit_log	Cada intento fallido queda registrado con IP y timestamp para detección de ataques.

8.2  Token Temporal de Sesión
Control	Valor	Detalle
Algoritmo de firma	HS256	Secret mínimo 64 chars. Rotación semestral. En producción: AWS Secrets Manager.
TTL del token	7200 segundos (2h)	Fijo, no renovable. Si expira, el cliente reinicia el proceso desde el Paso 1.
jti en Redis	SET return:session:{jti} EX 7200	Permite revocar tokens individuales sin invalidar todos los tokens. Al expirar Redis, el token también es inválido.
Scope explícito	'return:write'	El token solo autoriza operaciones del wizard. No da acceso al panel admin ni a otros pedidos.
orderId en claims	UUID interno	El guard verifica que el orderId del token = el orderId del recurso solicitado. Imposible acceder al pedido de otro cliente.
emailHash en claims	SHA-256	No se almacena el email en el token. Un token interceptado no expone el correo del cliente.

8.3  Seguridad en Uploads de Evidencia
Control	Valor	Detalle
Tipos permitidos	JPEG, PNG, WebP	Validación doble: Content-Type declarado + magic bytes reales (FFD8FF, 89504E47, 52494646).
Tamaño máximo	10 MB por archivo	Validado en el presigned URL policy: Content-Length-Range. El cliente no puede superar el límite.
Cantidad máxima	5 fotos por ítem	Validado en EvidenceService.confirmUpload() contando registros existentes en BD.
Pre-signed URL con TTL	15 minutos	El cliente tiene 15 min para subir el archivo. Después la URL expira y debe pedir una nueva.
Pre-signed URL con prefix fijo	ev/{returnId}/{uuid}	La URL firmada solo permite subir a esa clave exacta. No puede sobrescribir otros archivos.
Bucket privado	S3/R2 sin acceso público	Los archivos nunca son accesibles directamente. El admin ve URLs firmadas con TTL de 30 min.
Proceso asíncrono post-upload	Worker BullMQ	Verifica magic bytes, redimensiona a WebP máx 2000px. Si falla la validación, elimina el archivo y marca evidencia como inválida.

8.4  Seguridad del Panel Admin
Control	Valor	Detalle
Autenticación	JWT RS256	Access token (15 min) + Refresh token (7d) en cookie HttpOnly/Secure/SameSite=Strict.
RBAC	4 roles: AGENT, SUPERVISOR, ADMIN	RolesGuard en cada endpoint. Sin rol = 403. Los roles son aditivos (ADMIN puede todo lo que puede AGENT).
2FA (V2)	TOTP (Google Authenticator)	Para roles SUPERVISOR y ADMIN. En V1 solo usuario/contraseña con contraseña segura.
Blacklist de tokens	jti en Redis	Al hacer logout o cambio de contraseña, todos los tokens activos del usuario se invalidan inmediatamente.
Rate limit admin login	10 intentos / hora	Independiente del rate limit del wizard. Protege contra fuerza bruta de credenciales internas.
URLs de evidencias firmadas	TTL 30 min	El admin no ve las URLs de S3 directamente. El backend genera URLs firmadas temporales en cada solicitud de detalle.
Audit log completo	Inmutable	Cada cambio de estado, exportación o modificación de configuración queda registrado con quién, qué, cuándo, desde qué IP.

 

9	Esquema de Base de Datos
SQL Server — tablas, tipos enumerados, índices

Schema SQL de referencia (implementado con Prisma sobre SQL Server)
-- Nota: este bloque describe el modelo logico. En la implementacion actual con Prisma + SQL Server,
-- los estados/enum se manejan como cadenas controladas por la aplicacion y validacion backend.
-- Tipos enumerados (referencia logica)
CREATE TYPE order_status    AS ENUM ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED');
CREATE TYPE return_status   AS ENUM ('DRAFT','SUBMITTED','REVIEWING','APPROVED',
                                     'PRODUCT_RECEIVED','REFUND_PROCESSING','COMPLETED','REJECTED');
CREATE TYPE delivery_type   AS ENUM ('STORE','CARRIER');
CREATE TYPE refund_type     AS ENUM ('GIFT_CARD','MERCADOPAGO','ORIGINAL_PAYMENT');

-- Secuencia diaria para tickets (sin race condition)
-- Función que resetea a las 00:00 cada día
CREATE SEQUENCE return_daily_seq;  -- manejada por TicketService con lógica de fecha

-- orders: pedidos (fuente Shopify o propia)
id UUID PK | order_number VARCHAR(50) UNIQUE | customer_email VARCHAR(320)
customer_email_hash CHAR(64)  -- SHA-256 del email normalizado
customer_name VARCHAR(200) | status order_status NOT NULL
total_amount DECIMAL(12,2) | currency CHAR(3) | purchased_at TIMESTAMPTZ
delivered_at TIMESTAMPTZ | external_id VARCHAR(100) | metadata JSONB
created_at TIMESTAMPTZ | updated_at TIMESTAMPTZ

-- order_items: líneas de pedido
id UUID PK | order_id UUID FK→orders | sku VARCHAR(100) | product_name VARCHAR(300)
size VARCHAR(20) | color VARCHAR(50) | unit_price DECIMAL(12,2) | quantity INTEGER
image_url TEXT | is_returnable BOOLEAN DEFAULT true | return_deadline DATE

-- returns: solicitudes de devolución
id UUID PK | ticket_number VARCHAR(30) UNIQUE | order_id UUID FK→orders
customer_email_hash CHAR(64) | status return_status NOT NULL DEFAULT 'DRAFT'
delivery_method delivery_type | store_id UUID FK→stores NULL
carrier_address JSONB NULL | refund_method refund_type NULL
total_refund DECIMAL(12,2) NULL | notes TEXT NULL
submitted_at TIMESTAMPTZ NULL | created_at TIMESTAMPTZ | updated_at TIMESTAMPTZ

-- return_items: productos en la devolución
id UUID PK | return_id UUID FK→returns | order_item_id UUID FK→order_items
reason_codes TEXT[] NOT NULL | comments TEXT | quantity INTEGER NOT NULL DEFAULT 1
unit_refund DECIMAL(12,2) NOT NULL

-- return_evidences: fotos adjuntas
id UUID PK | return_item_id UUID FK→return_items
s3_key TEXT NOT NULL | s3_bucket VARCHAR(100) NOT NULL
mime_type VARCHAR(100) NOT NULL | file_size_bytes INTEGER NOT NULL
is_valid BOOLEAN DEFAULT true | created_at TIMESTAMPTZ

-- return_status_history: historial de cambios
id UUID PK | return_id UUID FK→returns
previous_status return_status | new_status return_status NOT NULL
changed_by VARCHAR(200) NOT NULL | notes TEXT | created_at TIMESTAMPTZ NOT NULL

-- stores: tiendas físicas
id UUID PK | name VARCHAR(200) | address TEXT | city VARCHAR(100)
department VARCHAR(100) | phone VARCHAR(30) | hours TEXT | is_active BOOLEAN DEFAULT true

-- audit_log: registro inmutable de acciones
id UUID PK | action VARCHAR(100) NOT NULL | actor VARCHAR(200) NOT NULL
resource_type VARCHAR(50) | resource_id UUID | ip_address INET
user_agent TEXT | metadata JSONB | created_at TIMESTAMPTZ NOT NULL

-- Índices críticos de rendimiento
CREATE INDEX idx_orders_lookup    ON orders(order_number, customer_email_hash);
CREATE INDEX idx_returns_order    ON returns(order_id, status);
CREATE INDEX idx_returns_status   ON returns(status, created_at DESC);
CREATE INDEX idx_return_items     ON return_items(return_id);
CREATE INDEX idx_stores_location  ON stores(department, city, is_active);
CREATE INDEX idx_audit_action     ON audit_log(action, created_at DESC);

 

10	Roadmap V1 / V2 / V3
Qué entra en cada versión — sin sobreingeniería

ℹ  V1 es el mínimo productivo real: reemplaza el sistema PHP actual con la misma funcionalidad pero arquitectura correcta. V2 agrega integraciones y capacidades operativas avanzadas. V3 es la visión a largo plazo.

10.1  V1 — Mínimo Productivo Real (Semanas 1–6)
V1 es funcionalidad completa del wizard de devoluciones más el panel de administración básico. Sin integraciones externas — los pedidos se importan manualmente o mediante un script de carga. El foco es reemplazar el PHP con cero pérdida de funcionalidad y máxima ganancia en seguridad y mantenibilidad.

Módulo	Componente	Detalle V1
Access	ReturnAccessService	Verificación pedido+correo, JWT firmado, rate limiting, audit log de accesos
Orders	OrderService + EligibilityService	Lookup de pedido, elegibilidad de ítems, cálculo de plazos por causal
Returns	ReturnsService — wizard completo	DRAFT → SUBMITTED: crear borrador, ítems, entrega, reembolso, submit, ticket
Evidences	EvidenceService	Presigned URL + confirmación. Sin procesamiento avanzado de imagen en V1.
Notifications	NotificationService	Emails de confirmación y actualización de estado. BullMQ + Resend.
Stores	StoresService	Búsqueda cascada departamento→ciudad→tienda. Caché Redis.
Admin	AdminService básico	Lista de devoluciones, detalle, cambio de estado manual, notas internas.
Audit	AuditService	Log de accesos, cambios de estado y acciones del panel. Solo escritura.
Frontend	React + Vite	Wizard completo (pasos 1-5 + confirmación) + panel admin básico.
BD	SQL Server + Prisma	Schema completo con migraciones. Seed de tiendas y pedidos de prueba.

Lo que NO entra en V1 (sobreingeniería para V1)
•	RefundService automatizado — en V1 el agente cambia el estado manualmente a COMPLETED
•	Shopify webhook integration — pedidos se cargan vía script o importación CSV
•	MercadoPago API programática — reembolsos se procesan manualmente fuera del sistema
•	2FA para panel admin — usuario + contraseña segura es suficiente para V1
•	Exportaciones async complejas — en V1 la exportación es síncrona para volúmenes pequeños
•	Métricas avanzadas / dashboard de KPIs — en V1 solo el listado filtrable con totales básicos
•	Procesamiento avanzado de imágenes — en V1 las fotos se guardan tal como vienen (con validación básica)

10.2  V2 — Integraciones y Capacidades Operativas (Semanas 7–14)
V2 conecta el sistema con el ecosistema externo de la empresa y agrega las herramientas que el equipo de operaciones necesita para gestionar volúmenes altos.

•	Shopify webhook: sincronización automática de pedidos en tiempo real (orders/fulfilled, orders/cancelled)
•	RefundService con MercadoPago API: emisión programática de reembolsos MERCADOPAGO y ORIGINAL_PAYMENT
•	Dashboard de métricas: volumen diario, tasa de aprobación, tiempo promedio de resolución, top 5 causales
•	Exportaciones async: CSV/XLSX con BullMQ. Email al supervisor cuando el archivo esté listo.
•	Procesamiento de imágenes: redimensionado a WebP max 2000px, thumbnails para el panel admin
•	Audit log con vista: página en el panel admin para consultar el historial de auditoría
•	2FA TOTP: para roles SUPERVISOR y ADMIN
•	Seguimiento de ticket para el cliente: página pública accesible con número de ticket (sin sessionToken)

10.3  V3 — Visión a Largo Plazo
•	Multi-tenant: soporte para múltiples marcas/tiendas bajo la misma plataforma
•	Reglas de negocio configurables desde UI: plazos por causal ajustables sin redeploy, tipos de productos excluidos configurables
•	Portal del cliente: historial de devoluciones con autenticación real (Google/email link)
•	Integraciones adicionales: carriers (Coordinadora, Servientrega), PSE directo, Wompi
•	Notificaciones push / WhatsApp: actualización de estado por canal preferido del cliente
•	Analítica avanzada: predicción de devoluciones, detección de fraude, análisis de causales por producto/talla

10.4  Tabla Resumen de Versiones
Capacidad	V1	V2	V3
Wizard pedido+correo (5 pasos)	✔ Incluido	✔ Incluido	✔ Incluido
Panel admin básico (cambio de estados)	✔ Incluido	✔ Incluido	✔ Incluido
Emails automáticos (confirmación, estados)	✔ Incluido	✔ Incluido	✔ Incluido
Evidencias fotográficas (upload + validación)	✔ Incluido	✔ Incluido	✔ Incluido
Seguridad: rate limit, token, RBAC	✔ Incluido	✔ Incluido	✔ Incluido
Shopify webhook (sync pedidos automático)	— (import manual)	✔ Incluido	✔ Incluido
Reembolso programático (MercadoPago API)	— (manual)	✔ Incluido	✔ Incluido
Métricas y dashboard KPIs	— (básico)	✔ Incluido	✔ Incluido
Exportaciones async (CSV/XLSX)	— (síncrono)	✔ Incluido	✔ Incluido
2FA para panel admin	— 	✔ Incluido	✔ Incluido
Reglas de negocio configurables desde UI	—	—pos	✔ Incluido
Portal cliente con historial	—	—	✔ Incluido
Multi-tenant	—	—	✔ Incluido

✔  V1 en producción es el objetivo. V2 y V3 se construyen sobre V1 sin romper nada — gracias a la arquitectura modular de NestJS y la separación clara de responsabilidades entre servicios.


