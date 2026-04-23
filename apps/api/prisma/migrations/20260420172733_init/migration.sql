-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoDevolucion" AS ENUM ('BORRADOR', 'ENVIADA', 'EN_REVISION', 'APROBADA', 'PRODUCTO_RECIBIDO', 'REEMBOLSO_EN_PROCESO', 'COMPLETADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('TIENDA', 'TRANSPORTADORA');

-- CreateEnum
CREATE TYPE "TipoReembolso" AS ENUM ('TARJETA_REGALO', 'MERCADOPAGO', 'MEDIO_ORIGINAL');

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "numero_pedido" TEXT NOT NULL,
    "correo_cliente" TEXT NOT NULL,
    "correo_cliente_hash" TEXT NOT NULL,
    "nombre_cliente" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL,
    "fecha_entrega" TIMESTAMP(3),
    "external_id" TEXT,
    "metadata" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_items" (
    "id" UUID NOT NULL,
    "pedido_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "talla" TEXT,
    "color" TEXT,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "url_imagen" TEXT,
    "es_devolvible" BOOLEAN NOT NULL DEFAULT true,
    "fecha_limite" TIMESTAMP(3),

    CONSTRAINT "pedido_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" UUID NOT NULL,
    "numero_ticket" TEXT,
    "pedido_id" UUID NOT NULL,
    "correo_cliente_hash" TEXT NOT NULL,
    "estado" "EstadoDevolucion" NOT NULL DEFAULT 'BORRADOR',
    "metodo_entrega" "TipoEntrega",
    "tienda_id" UUID,
    "direccion_envio" JSONB,
    "metodo_reembolso" "TipoReembolso",
    "total_reembolso" DECIMAL(12,2),
    "notas" TEXT,
    "enviada_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_items" (
    "id" UUID NOT NULL,
    "devolucion_id" UUID NOT NULL,
    "pedido_item_id" UUID NOT NULL,
    "causales" TEXT[],
    "comentarios" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "valor_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "devolucion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" UUID NOT NULL,
    "devolucion_item_id" UUID NOT NULL,
    "clave_archivo" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "tamanio_bytes" INTEGER NOT NULL,
    "esValido" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" UUID NOT NULL,
    "devolucion_id" UUID NOT NULL,
    "estadoAnterior" "EstadoDevolucion",
    "estadoNuevo" "EstadoDevolucion" NOT NULL,
    "cambiado_por" TEXT NOT NULL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiendas" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "telefono" TEXT,
    "horario" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "accion" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "tipo_recurso" TEXT,
    "id_recurso" UUID,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_pedido_key" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_numero_ticket_key" ON "devoluciones"("numero_ticket");

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_items" ADD CONSTRAINT "devolucion_items_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_items" ADD CONSTRAINT "devolucion_items_pedido_item_id_fkey" FOREIGN KEY ("pedido_item_id") REFERENCES "pedido_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_devolucion_item_id_fkey" FOREIGN KEY ("devolucion_item_id") REFERENCES "devolucion_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
