/**
 * Script para insertar pedidos de prueba con referencias KOAJ TEENS.
 * NO borra otros datos — solo agrega/reemplaza los pedidos PM-KOAJ-*.
 *
 * Ejecutar con:
 *   npx ts-node -r tsconfig-paths/register prisma/insert-koaj-products.ts
 *
 * Pedidos creados (todos para odanieloperez26@hotmail.com):
 *   PM-KOAJ-001  entregado hace 2 días  → ventanas 5d y 30d abiertas
 *   PM-KOAJ-002  entregado hace 6 días  → ventanas 5d y 30d abiertas
 *   PM-KOAJ-003  entregado hace 12 días → solo ventana 30d abierta
 *   PM-KOAJ-004  entregado hace 35 días → todas las ventanas cerradas
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const EMAIL = 'odanieloperez26@hotmail.com';
const NOMBRE = 'Oscar Daniel Pérez';

// ── Catálogo completo de referencias ────────────────────────────────────────
const CAMISETAS = [
  { sku: '181619', nombre: 'Camiseta Koaj Mercury TN', talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107016/array.jpg' },
  { sku: '181619', nombre: 'Camiseta Koaj Mercury TN', talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107016/array.jpg' },
  { sku: '181620', nombre: 'Camiseta Koaj Mole TN', talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107019/array.jpg' },
  { sku: '181620', nombre: 'Camiseta Koaj Mole TN', talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107019/array.jpg' },
  { sku: '181621', nombre: 'Camiseta Koaj Neptune TN', talla: '10/12', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107022/array.jpg' },
  { sku: '181621', nombre: 'Camiseta Koaj Neptune TN', talla: '12/14', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107022/array.jpg' },
  { sku: '181622', nombre: 'Camiseta Koaj Mush TN', talla: '10/12', color: '937', precio: 25900, imagen: 'https://omspermoda.koaj.co/107023/array.jpg' },
  { sku: '181622', nombre: 'Camiseta Koaj Mush TN', talla: '12/14', color: '937', precio: 25900, imagen: 'https://omspermoda.koaj.co/107023/array.jpg' },
  { sku: '181866', nombre: 'Camiseta Koaj Kepler TN', talla: '10/12', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107024/array.jpg' },
  { sku: '181866', nombre: 'Camiseta Koaj Kepler TN', talla: '12/14', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107024/array.jpg' },
  { sku: '182826', nombre: 'Camiseta Koaj Fionn TN', talla: '10/12', color: '969', precio: 29900, imagen: 'https://omspermoda.koaj.co/107025/array.jpg' },
  { sku: '182826', nombre: 'Camiseta Koaj Fionn TN', talla: '12/14', color: '969', precio: 29900, imagen: 'https://omspermoda.koaj.co/107025/array.jpg' },
];

const BUSOS = [
  { sku: '182077', nombre: 'Suéter Koaj Izan TN', talla: '10/12', color: '910', precio: 69900, imagen: 'https://omspermoda.koaj.co/107026/array.jpg' },
  { sku: '182077', nombre: 'Suéter Koaj Izan TN', talla: '12/14', color: '910', precio: 69900, imagen: 'https://omspermoda.koaj.co/107026/array.jpg' },
];

const PANTALONES = [
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN', talla: '8/10', color: '942', precio: 99900, imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN', talla: '10/12', color: '942', precio: 99900, imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN', talla: '12/14', color: '942', precio: 99900, imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '8/10', color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '10/12', color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '12/14', color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181157', nombre: 'Pantalón Koaj Slim TN', talla: '10/12', color: '909', precio: 99900, imagen: 'https://omspermoda.koaj.co/107032/array.jpg' },
  { sku: '181157', nombre: 'Pantalón Koaj Slim TN', talla: '12/14', color: '909', precio: 99900, imagen: 'https://omspermoda.koaj.co/107032/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN', talla: '10/12', color: '909', precio: 59900, imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
];

type Item = { sku: string; nombre: string; talla: string; color: string; precio: number; imagen: string };

interface OrderSpec {
  numeroPedido: string;
  diasEntrega: number;
  diasCompra: number;
  items: Item[];
  descripcion: string;
}

const PEDIDOS: OrderSpec[] = [
  {
    numeroPedido: 'PM-KOAJ-001',
    diasCompra: 10,
    diasEntrega: 2,
    items: CAMISETAS,
    descripcion: 'Camisetas — entregado hace 2 días (ventanas 5d y 30d abiertas)',
  },
  {
    numeroPedido: 'PM-KOAJ-002',
    diasCompra: 14,
    diasEntrega: 6,
    items: [...BUSOS, ...PANTALONES.slice(0, 4)],
    descripcion: 'Busos + Pantalones 90S — entregado hace 6 días (ventanas 5d y 30d abiertas)',
  },
  {
    numeroPedido: 'PM-KOAJ-003',
    diasCompra: 20,
    diasEntrega: 12,
    items: PANTALONES.slice(4),
    descripcion: 'Pantalones Slim + Jogger — entregado hace 12 días (solo ventana 30d abierta)',
  },
  {
    numeroPedido: 'PM-KOAJ-004',
    diasCompra: 45,
    diasEntrega: 35,
    items: [...CAMISETAS.slice(0, 4), ...BUSOS],
    descripcion: 'Mezcla — entregado hace 35 días (todas las ventanas cerradas)',
  },
];

async function limpiarPedido(numeroPedido: string) {
  const existing = await prisma.pedido.findFirst({ where: { numeroPedido } });
  if (existing) {
    // Eliminar devoluciones asociadas primero
    const devoluciones = await prisma.devolucion.findMany({ where: { pedidoId: existing.id } });
    for (const dev of devoluciones) {
      const devItems = await prisma.devolucionItem.findMany({ where: { devolucionId: dev.id } });
      for (const di of devItems) {
        await prisma.evidencia.deleteMany({ where: { devolucionItemId: di.id } });
      }
      await prisma.devolucionItem.deleteMany({ where: { devolucionId: dev.id } });
      await prisma.historialEstado.deleteMany({ where: { devolucionId: dev.id } });
      await prisma.devolucion.delete({ where: { id: dev.id } });
    }
    await prisma.pedidoItem.deleteMany({ where: { pedidoId: existing.id } });
    await prisma.pedido.delete({ where: { id: existing.id } });
    console.log(`  ↺ Reemplazando ${numeroPedido}...`);
  }
}

async function main() {
  console.log('🛍️  Insertando pedidos KOAJ TEENS...\n');

  for (const spec of PEDIDOS) {
    await limpiarPedido(spec.numeroPedido);

    const total = spec.items.reduce((sum, i) => sum + i.precio, 0);

    const pedido = await prisma.pedido.create({
      data: {
        numeroPedido: spec.numeroPedido,
        correoCliente: EMAIL,
        correoClienteHash: emailHash(EMAIL),
        nombreCliente: NOMBRE,
        estado: 'ENTREGADO',
        total,
        moneda: 'COP',
        fechaCompra: daysAgo(spec.diasCompra),
        fechaEntrega: daysAgo(spec.diasEntrega),
        items: {
          create: spec.items.map((item) => ({
            sku: item.sku,
            nombreProducto: item.nombre,
            talla: item.talla,
            color: item.color,
            precioUnitario: item.precio,
            cantidad: 1,
            urlImagen: item.imagen,
            esDevolvible: true,
          })),
        },
      },
      include: { items: true },
    });

    console.log(`  ✓ ${pedido.numeroPedido}  ·  ${pedido.items.length} ítems  ·  $${total.toLocaleString('es-CO')} COP`);
    console.log(`    ${spec.descripcion}`);
  }

  console.log('\n✅ Listo. Pedidos de prueba disponibles:\n');
  console.log(`  Correo: ${EMAIL}\n`);
  for (const spec of PEDIDOS) {
    console.log(`  ${spec.numeroPedido}  →  ${spec.descripcion}`);
  }
  console.log('\n  URL wizard: http://localhost:5174');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => void prisma.$disconnect());
