/**
 * Seed de datos de prueba para el sistema de devoluciones.
 *
 * Ejecutar con:
 *   npx prisma db seed
 *
 * Credenciales de prueba generadas:
 *   ADMIN:  admin@permoda.com.co  /  Admin1234!
 *   AGENTE: agente@permoda.com.co /  Agente1234!
 *
 * Pedidos de prueba:
 *   PM-2024-001  carlos.garcia@gmail.com   → entregado hace 3 días  (ventanas 5d y 30d abiertas)
 *   PM-2024-002  maria.lopez@hotmail.com   → entregado hace 10 días (solo ventana 30d abierta)
 *   PM-2024-003  juan.perez@outlook.com    → entregado hace 40 días (todas ventanas cerradas)
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createHash } from 'crypto';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── 1. Limpiar datos anteriores ─────────────────────────────────────────
  await prisma.auditoria.deleteMany();
  await prisma.historialEstado.deleteMany();
  await prisma.evidencia.deleteMany();
  await prisma.devolucionItem.deleteMany();
  await prisma.devolucion.deleteMany();
  await prisma.pedidoItem.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.tienda.deleteMany();
  await prisma.usuarioAdmin.deleteMany();

  // ── 2. Tiendas ──────────────────────────────────────────────────────────
  const tiendas = await Promise.all([
    prisma.tienda.create({ data: { nombre: 'Permoda Andino', direccion: 'Cra 11 #82-71 Local 241, C.C. Andino', ciudad: 'Bogotá', departamento: 'Cundinamarca', telefono: '6017200001', horario: 'Lun–Sáb 10am–9pm · Dom 11am–8pm', activo: true } }),
    prisma.tienda.create({ data: { nombre: 'Permoda Gran Estación', direccion: 'Av. calle 26 #62-47 Local 1-144', ciudad: 'Bogotá', departamento: 'Cundinamarca', telefono: '6017200002', horario: 'Lun–Sáb 10am–9pm · Dom 11am–8pm', activo: true } }),
    prisma.tienda.create({ data: { nombre: 'Permoda El Tesoro', direccion: 'Cra 25A #1A Sur-45 Local 2-110, C.C. El Tesoro', ciudad: 'Medellín', departamento: 'Antioquia', telefono: '6044300001', horario: 'Lun–Sáb 10am–9pm · Dom 11am–8pm', activo: true } }),
    prisma.tienda.create({ data: { nombre: 'Permoda Chipichape', direccion: 'Calle 5N #1N-41 Local 214, C.C. Chipichape', ciudad: 'Cali', departamento: 'Valle del Cauca', telefono: '6023200001', horario: 'Lun–Sáb 10am–9pm · Dom 11am–8pm', activo: true } }),
    prisma.tienda.create({ data: { nombre: 'Permoda Buenavista', direccion: 'Cra 53 #98-99 Local 243, C.C. Buenavista', ciudad: 'Barranquilla', departamento: 'Atlántico', telefono: '6053200001', horario: 'Lun–Sáb 10am–9pm · Dom 11am–8pm', activo: true } }),
  ]);
  console.log(`  ✓ ${tiendas.length} tiendas creadas`);

  // ── 3. Usuarios admin ───────────────────────────────────────────────────
  const [adminUser, agenteUser] = await Promise.all([
    prisma.usuarioAdmin.create({
      data: {
        nombre: 'Admin Permoda',
        correo: 'admin@permoda.com.co',
        passwordHash: await hash('Admin1234!', 12),
        rol: 'ADMIN',
        activo: true,
      },
    }),
    prisma.usuarioAdmin.create({
      data: {
        nombre: 'Agente Operaciones',
        correo: 'agente@permoda.com.co',
        passwordHash: await hash('Agente1234!', 12),
        rol: 'AGENTE',
        activo: true,
      },
    }),
  ]);
  console.log(`  ✓ Usuarios admin: ${adminUser.correo}, ${agenteUser.correo}`);

  // ── 4. Pedido 1 — Reciente (3 días) — ventanas 5d y 30d abiertas ────────
  const email1 = 'carlos.garcia@gmail.com';
  const pedido1 = await prisma.pedido.create({
    data: {
      numeroPedido: 'PM-2024-001',
      correoCliente: email1,
      correoClienteHash: emailHash(email1),
      nombreCliente: 'Carlos García Rodríguez',
      estado: 'ENTREGADO',
      total: 424700,
      moneda: 'COP',
      fechaCompra: daysAgo(10),
      fechaEntrega: daysAgo(3),
      items: {
        create: [
          {
            sku: 'CAM-001-M',
            nombreProducto: 'Camisa Slim Fit Azul Marino',
            talla: 'M',
            color: 'Azul Marino',
            precioUnitario: 89900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'PAN-001-32',
            nombreProducto: 'Pantalón Chino Beige',
            talla: '32',
            color: 'Beige',
            precioUnitario: 149900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'ZAP-001-42',
            nombreProducto: 'Zapatos Cuero Oxford Café',
            talla: '42',
            color: 'Café',
            precioUnitario: 249900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'COR-001',
            nombreProducto: 'Corbata Seda Estampada (Venta Final)',
            talla: null,
            color: 'Multicolor',
            precioUnitario: 45000,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: false, // No devolvible
          },
        ],
      },
    },
  });
  console.log(`  ✓ Pedido 1: ${pedido1.numeroPedido} (${email1}) — entregado hace 3 días`);

  // ── 5. Pedido 2 — Intermedio (10 días) — solo ventana 30d abierta ───────
  const email2 = 'maria.lopez@hotmail.com';
  const pedido2 = await prisma.pedido.create({
    data: {
      numeroPedido: 'PM-2024-002',
      correoCliente: email2,
      correoClienteHash: emailHash(email2),
      nombreCliente: 'María López Martínez',
      estado: 'ENTREGADO',
      total: 389800,
      moneda: 'COP',
      fechaCompra: daysAgo(18),
      fechaEntrega: daysAgo(10),
      items: {
        create: [
          {
            sku: 'VES-001-S',
            nombreProducto: 'Vestido Casual Floral',
            talla: 'S',
            color: 'Multicolor',
            precioUnitario: 189900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'BLU-001-M',
            nombreProducto: 'Blusa Seda Blanca',
            talla: 'M',
            color: 'Blanco',
            precioUnitario: 119900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'BOL-001',
            nombreProducto: 'Bolso de Mano Cuero',
            talla: null,
            color: 'Negro',
            precioUnitario: 199900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
        ],
      },
    },
  });
  console.log(`  ✓ Pedido 2: ${pedido2.numeroPedido} (${email2}) — entregado hace 10 días`);

  // ── 6. Pedido 3 — Antiguo (40 días) — todas las ventanas cerradas ────────
  const email3 = 'juan.perez@outlook.com';
  const pedido3 = await prisma.pedido.create({
    data: {
      numeroPedido: 'PM-2024-003',
      correoCliente: email3,
      correoClienteHash: emailHash(email3),
      nombreCliente: 'Juan Pérez Gómez',
      estado: 'ENTREGADO',
      total: 259800,
      moneda: 'COP',
      fechaCompra: daysAgo(50),
      fechaEntrega: daysAgo(40),
      items: {
        create: [
          {
            sku: 'ABR-001-L',
            nombreProducto: 'Abrigo Lana Gris',
            talla: 'L',
            color: 'Gris',
            precioUnitario: 389900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
          {
            sku: 'BUF-001',
            nombreProducto: 'Bufanda Lana Italiana',
            talla: null,
            color: 'Gris Oscuro',
            precioUnitario: 89900,
            cantidad: 1,
            urlImagen: null,
            esDevolvible: true,
          },
        ],
      },
    },
  });
  console.log(`  ✓ Pedido 3: ${pedido3.numeroPedido} (${email3}) — entregado hace 40 días`);

  // ── 7. Devolución de ejemplo ya en proceso (para probar panel admin) ─────
  const items1 = await prisma.pedidoItem.findMany({ where: { pedidoId: pedido1.id } });
  const itemCamisa = items1.find(i => i.sku === 'CAM-001-M')!;

  const enviadaEn = daysAgo(5);
  const ticketDateStr = enviadaEn.toISOString().slice(0, 10).replace(/-/g, '');
  const exampleTicket = `DV-${ticketDateStr}-0001`;

  const devEjemplo = await prisma.devolucion.create({
    data: {
      pedidoId: pedido1.id,
      correoClienteHash: emailHash(email1),
      estado: 'ENVIADA',
      metodoEntrega: 'TIENDA',
      tiendaId: tiendas[0].id,
      metodoReembolso: 'MERCADOPAGO',
      totalReembolso: 89900,
      enviadaEn,
      items: {
        create: [{
          pedidoItemId: itemCamisa.id,
          causales: ['SIZE_LARGE'],
          comentarios: 'La talla M me quedó muy grande, necesito S.',
          cantidad: 1,
          valorUnitario: 89900,
        }],
      },
    },
  });

  // Genera ticket y agrega historial
  await prisma.devolucion.update({
    where: { id: devEjemplo.id },
    data: { numeroTicket: exampleTicket },
  });

  await prisma.historialEstado.create({
    data: {
      devolucionId: devEjemplo.id,
      estadoAnterior: 'BORRADOR',
      estadoNuevo: 'ENVIADA',
      cambiadoPor: 'sistema',
      notas: 'Cliente completó el wizard y envió la solicitud.',
    },
  });
  console.log(`  ✓ Devolución de ejemplo creada: ${exampleTicket} (estado ENVIADA)`);

  // ── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado. Datos de prueba:\n');
  console.log('  PANEL ADMIN:');
  console.log('    URL:      http://localhost:5173/admin/login');
  console.log('    Admin:    admin@permoda.com.co  /  Admin1234!');
  console.log('    Agente:   agente@permoda.com.co /  Agente1234!\n');
  console.log('  WIZARD DEVOLUCIONES:');
  console.log('    URL:      http://localhost:5173');
  console.log('    Pedido 1 (5d+30d abiertos):  PM-2024-001  /  carlos.garcia@gmail.com');
  console.log('    Pedido 2 (solo 30d):          PM-2024-002  /  maria.lopez@hotmail.com');
  console.log('    Pedido 3 (todo cerrado):      PM-2024-003  /  juan.perez@outlook.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => void prisma.$disconnect());
