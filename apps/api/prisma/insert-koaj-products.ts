/**
 * Script para insertar pedidos de prueba con referencias KOAJ TEENS.
 * NO borra otros datos — solo agrega/reemplaza los pedidos PM-KOAJ-*.
 *
 * Ejecutar con:
 *   npx ts-node -r tsconfig-paths/register prisma/insert-koaj-products.ts
 *
 * Pedidos creados (todos para odanieloperez26@hotmail.com):
 *   PM-KOAJ-001  entregado hace 2 días   → ventanas 5d y 30d abiertas  (Camisetas masculinas)
 *   PM-KOAJ-002  entregado hace 4 días   → ventanas 5d y 30d abiertas  (Pantalones + Busos masculinos)
 *   PM-KOAJ-003  entregado hace 8 días   → solo ventana 30d abierta    (Camisetas femeninas lote 1)
 *   PM-KOAJ-004  entregado hace 12 días  → solo ventana 30d abierta    (Camisetas femeninas Disney)
 *   PM-KOAJ-005  entregado hace 35 días  → todas las ventanas cerradas  (Mezcla)
 */

import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaMssql({
    server: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    options: { trustServerCertificate: true },
    pool: { max: 1, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 30000,
    requestTimeout: 60000,
  }),
});

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

type Item = { sku: string; nombre: string; talla: string; color: string; precio: number; imagen: string };

// ── Catálogo masculino ───────────────────────────────────────────────────────
const CAMISETAS_MASC: Item[] = [
  { sku: '181619', nombre: 'Camiseta Koaj Mercury TN',  talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107016/array.jpg' },
  { sku: '181619', nombre: 'Camiseta Koaj Mercury TN',  talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107016/array.jpg' },
  { sku: '181620', nombre: 'Camiseta Koaj Mole TN',     talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107019/array.jpg' },
  { sku: '181620', nombre: 'Camiseta Koaj Mole TN',     talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107019/array.jpg' },
  { sku: '181621', nombre: 'Camiseta Koaj Neptune TN',  talla: '10/12', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107022/array.jpg' },
  { sku: '181621', nombre: 'Camiseta Koaj Neptune TN',  talla: '12/14', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107022/array.jpg' },
  { sku: '181622', nombre: 'Camiseta Koaj Mush TN',     talla: '10/12', color: '937', precio: 25900, imagen: 'https://omspermoda.koaj.co/107023/array.jpg' },
  { sku: '181622', nombre: 'Camiseta Koaj Mush TN',     talla: '12/14', color: '937', precio: 25900, imagen: 'https://omspermoda.koaj.co/107023/array.jpg' },
  { sku: '181866', nombre: 'Camiseta Koaj Kepler TN',   talla: '10/12', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107024/array.jpg' },
  { sku: '181866', nombre: 'Camiseta Koaj Kepler TN',   talla: '12/14', color: '909', precio: 25900, imagen: 'https://omspermoda.koaj.co/107024/array.jpg' },
  { sku: '182826', nombre: 'Camiseta Koaj Fionn TN',    talla: '10/12', color: '969', precio: 29900, imagen: 'https://omspermoda.koaj.co/107025/array.jpg' },
  { sku: '182826', nombre: 'Camiseta Koaj Fionn TN',    talla: '12/14', color: '969', precio: 29900, imagen: 'https://omspermoda.koaj.co/107025/array.jpg' },
];

const BUSOS_MASC: Item[] = [
  { sku: '182077', nombre: 'Suéter Koaj Izan TN', talla: '10/12', color: '910', precio: 69900, imagen: 'https://omspermoda.koaj.co/107026/array.jpg' },
  { sku: '182077', nombre: 'Suéter Koaj Izan TN', talla: '12/14', color: '910', precio: 69900, imagen: 'https://omspermoda.koaj.co/107026/array.jpg' },
];

const PANTALONES_MASC: Item[] = [
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN',          talla: '8/10',  color: '942', precio: 99900,  imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN',          talla: '10/12', color: '942', precio: 99900,  imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181095', nombre: 'Pantalón Koaj 90S TN',          talla: '12/14', color: '942', precio: 99900,  imagen: 'https://omspermoda.koaj.co/107030/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '8/10',  color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '10/12', color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181096', nombre: 'Pantalón Koaj 90S Color 946 TN', talla: '12/14', color: '946', precio: 109900, imagen: 'https://omspermoda.koaj.co/107031/array.jpg' },
  { sku: '181157', nombre: 'Pantalón Koaj Slim TN',          talla: '10/12', color: '909', precio: 99900,  imagen: 'https://omspermoda.koaj.co/107032/array.jpg' },
  { sku: '181157', nombre: 'Pantalón Koaj Slim TN',          talla: '12/14', color: '909', precio: 99900,  imagen: 'https://omspermoda.koaj.co/107032/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '10/12', color: '909', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '12/14', color: '909', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '10/12', color: '912', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '12/14', color: '912', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '10/12', color: '937', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
  { sku: '182088', nombre: 'Pantalón Koaj Jogger Ali TN',    talla: '12/14', color: '937', precio: 59900,  imagen: 'https://omspermoda.koaj.co/107037/array.jpg' },
];

// ── Catálogo femenino ────────────────────────────────────────────────────────
const CAMISETAS_FEM_L1: Item[] = [
  { sku: '184179', nombre: 'Camiseta Koaj Hibiscus TN', talla: '10/12', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107045/array.jpg' },
  { sku: '184179', nombre: 'Camiseta Koaj Hibiscus TN', talla: '12/14', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107045/array.jpg' },
  { sku: '181415', nombre: 'Camiseta Koaj Quin TN',     talla: '10/12', color: '960', precio: 29900, imagen: 'https://omspermoda.koaj.co/107046/array.jpg' },
  { sku: '181415', nombre: 'Camiseta Koaj Quin TN',     talla: '12/14', color: '960', precio: 29900, imagen: 'https://omspermoda.koaj.co/107046/array.jpg' },
  { sku: '181417', nombre: 'Camiseta Koaj Tay TN',      talla: '10/12', color: '909', precio: 29900, imagen: 'https://omspermoda.koaj.co/107050/array.jpg' },
  { sku: '181417', nombre: 'Camiseta Koaj Tay TN',      talla: '12/14', color: '909', precio: 29900, imagen: 'https://omspermoda.koaj.co/107050/array.jpg' },
  { sku: '181616', nombre: 'Camiseta Koaj Mallow TN',   talla: '10/12', color: '909', precio: 29900, imagen: 'https://omspermoda.koaj.co/107051/array.jpg' },
  { sku: '181616', nombre: 'Camiseta Koaj Mallow TN',   talla: '12/14', color: '909', precio: 29900, imagen: 'https://omspermoda.koaj.co/107051/array.jpg' },
  { sku: '181617', nombre: 'Camiseta Koaj Sharon TN',   talla: '10/12', color: '912', precio: 25900, imagen: 'https://omspermoda.koaj.co/107052/array.jpg' },
  { sku: '181617', nombre: 'Camiseta Koaj Sharon TN',   talla: '12/14', color: '912', precio: 25900, imagen: 'https://omspermoda.koaj.co/107052/array.jpg' },
  { sku: '182057', nombre: 'Camiseta Koaj Chelsea TN',  talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107053/array.jpg' },
  { sku: '182057', nombre: 'Camiseta Koaj Chelsea TN',  talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107053/array.jpg' },
  { sku: '182828', nombre: 'Camiseta Koaj Fore TN',     talla: '10/12', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107058/array.jpg' },
  { sku: '182828', nombre: 'Camiseta Koaj Fore TN',     talla: '12/14', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107058/array.jpg' },
];

const CAMISETAS_FEM_DISNEY: Item[] = [
  { sku: '183672', nombre: 'Camiseta Koaj Epizz TN',  talla: '10/12', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107062/array.jpg' },
  { sku: '183672', nombre: 'Camiseta Koaj Epizz TN',  talla: '12/14', color: '910', precio: 25900, imagen: 'https://omspermoda.koaj.co/107062/array.jpg' },
  { sku: '183673', nombre: 'Camiseta Koaj Milok TN',  talla: '10/12', color: '941', precio: 29900, imagen: 'https://omspermoda.koaj.co/107063/array.jpg' },
  { sku: '183673', nombre: 'Camiseta Koaj Milok TN',  talla: '12/14', color: '941', precio: 29900, imagen: 'https://omspermoda.koaj.co/107063/array.jpg' },
  { sku: '183674', nombre: 'Camiseta Koaj Kliot TN',  talla: '10/12', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107064/array.jpg' },
  { sku: '183674', nombre: 'Camiseta Koaj Kliot TN',  talla: '12/14', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107064/array.jpg' },
  { sku: '183675', nombre: 'Camiseta Koaj Sem TN',    talla: '10/12', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107069/array.jpg' },
  { sku: '183675', nombre: 'Camiseta Koaj Sem TN',    talla: '12/14', color: '910', precio: 29900, imagen: 'https://omspermoda.koaj.co/107069/array.jpg' },
  { sku: '184223', nombre: 'Camiseta Koaj Ever TN',   talla: '10/12', color: '914', precio: 25900, imagen: 'https://omspermoda.koaj.co/107070/array.jpg' },
  { sku: '184223', nombre: 'Camiseta Koaj Ever TN',   talla: '12/14', color: '914', precio: 25900, imagen: 'https://omspermoda.koaj.co/107070/array.jpg' },
  { sku: '184226', nombre: 'Camiseta Koaj Gosty TN',  talla: '10/12', color: '914', precio: 29900, imagen: 'https://omspermoda.koaj.co/107071/array.jpg' },
  { sku: '184226', nombre: 'Camiseta Koaj Gosty TN',  talla: '12/14', color: '914', precio: 29900, imagen: 'https://omspermoda.koaj.co/107071/array.jpg' },
  { sku: '184253', nombre: 'Camiseta Koaj Rue TN',    talla: '10/12', color: '914', precio: 29900, imagen: 'https://omspermoda.koaj.co/107072/array.jpg' },
  { sku: '184253', nombre: 'Camiseta Koaj Rue TN',    talla: '12/14', color: '914', precio: 29900, imagen: 'https://omspermoda.koaj.co/107072/array.jpg' },
];

interface OrderSpec {
  numeroPedido: string;
  diasCompra: number;
  diasEntrega: number;
  items: Item[];
  descripcion: string;
}

const PEDIDOS: OrderSpec[] = [
  {
    numeroPedido: 'PM-KOAJ-001',
    diasCompra: 10,
    diasEntrega: 2,
    items: CAMISETAS_MASC,
    descripcion: 'Camisetas masculinas KOAJ — entregado hace 2 días (ventanas 5d y 30d abiertas)',
  },
  {
    numeroPedido: 'PM-KOAJ-002',
    diasCompra: 14,
    diasEntrega: 4,
    items: [...BUSOS_MASC, ...PANTALONES_MASC],
    descripcion: 'Busos + Pantalones masculinos KOAJ — entregado hace 4 días (ventanas 5d y 30d abiertas)',
  },
  {
    numeroPedido: 'PM-KOAJ-003',
    diasCompra: 18,
    diasEntrega: 8,
    items: CAMISETAS_FEM_L1,
    descripcion: 'Camisetas femeninas KOAJ lote 1 — entregado hace 8 días (solo ventana 30d abierta)',
  },
  {
    numeroPedido: 'PM-KOAJ-004',
    diasCompra: 22,
    diasEntrega: 12,
    items: CAMISETAS_FEM_DISNEY,
    descripcion: 'Camisetas femeninas KOAJ Disney — entregado hace 12 días (solo ventana 30d abierta)',
  },
  {
    numeroPedido: 'PM-KOAJ-005',
    diasCompra: 45,
    diasEntrega: 35,
    items: [...CAMISETAS_MASC.slice(0, 4), ...CAMISETAS_FEM_DISNEY.slice(0, 4)],
    descripcion: 'Mezcla — entregado hace 35 días (todas las ventanas cerradas)',
  },
];

async function limpiarPedido(numeroPedido: string) {
  const existing = await prisma.pedido.findFirst({ where: { numeroPedido } });
  if (!existing) return;

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

async function main() {
  console.log('🛍️  Insertando pedidos KOAJ TEENS...\n');
  await prisma.$connect();

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

  console.log('\n✅ Listo. Pedidos disponibles para odanieloperez26@hotmail.com:\n');
  for (const spec of PEDIDOS) {
    console.log(`  ${spec.numeroPedido}  →  ${spec.descripcion}`);
  }
  console.log('\n  URL wizard: http://localhost:5173');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });
