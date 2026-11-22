/**
 * Papelería Nova seed — realistic data in Spanish (school and office supplies).
 * Currency: Lempiras (L). Prices as Decimal built from strings for precision.
 *
 * Idempotent: deletes in FK order and recreates. Run with `npm run db:seed`.
 *
 * SECURITY NOTICE: the plain-text passwords below are FOR DEVELOPMENT
 * ONLY. Never use these credentials in production. The hashes are never
 * printed to the console.
 */
import { PrismaClient, Prisma, Role, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
// The catalog data (categories + products + slug helper) lives in a shared
// module so that other scripts (e.g. image placeholders) reuse EXACTLY the
// same slugs without duplicating data.
import { CATALOGO, toSlug } from "./datos";

const prisma = new PrismaClient();

// ── DEVELOPMENT-ONLY credentials ────────────────────────────────────────────
const DEV_PASSWORD_ADMIN = "Admin123!";
const DEV_PASSWORD_VENDEDOR = "Vendedor123!";
const DEV_PASSWORD_CLIENTE = "Cliente123!";
const BCRYPT_COST = 10;

// Helper: Lempira price -> Prisma Decimal.
const L = (valor: string): Prisma.Decimal => new Prisma.Decimal(valor);

async function main() {
  console.log("🌱 Iniciando seed de Papelería Nova...");

  // ── Idempotent cleanup in FK order (children -> parents) ──────────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Tablas limpiadas.");

  // ── Users ─────────────────────────────────────────────────────────────────
  const [hashAdmin, hashVendedor, hashCliente] = await Promise.all([
    bcrypt.hash(DEV_PASSWORD_ADMIN, BCRYPT_COST),
    bcrypt.hash(DEV_PASSWORD_VENDEDOR, BCRYPT_COST),
    bcrypt.hash(DEV_PASSWORD_CLIENTE, BCRYPT_COST),
  ]);

  const admin = await prisma.user.create({
    data: {
      nombre: "Alejandra Mejía",
      email: "admin@papelerianova.hn",
      passwordHash: hashAdmin,
      role: Role.ADMIN,
    },
  });

  const vendedor = await prisma.user.create({
    data: {
      nombre: "Carlos Banegas",
      email: "vendedor@papelerianova.hn",
      passwordHash: hashVendedor,
      role: Role.VENDEDOR,
    },
  });

  const cliente1 = await prisma.user.create({
    data: {
      nombre: "María Fernanda López",
      email: "cliente@papelerianova.hn",
      passwordHash: hashCliente,
      role: Role.CLIENTE,
      direcciones: {
        create: [
          {
            linea1: "Col. Palmira, Calle República de México #245",
            linea2: "Casa color terracota, portón negro",
            ciudad: "Tegucigalpa",
            departamento: "Francisco Morazán",
            telefono: "+504 9988-7766",
            esPredeterminada: true,
          },
        ],
      },
    },
  });

  const cliente2 = await prisma.user.create({
    data: {
      nombre: "José Roberto Andino",
      email: "cliente2@papelerianova.hn",
      passwordHash: hashCliente,
      role: Role.CLIENTE,
      direcciones: {
        create: [
          {
            linea1: "Barrio Río de Piedras, Avenida Circunvalación",
            ciudad: "San Pedro Sula",
            departamento: "Cortés",
            telefono: "+504 9911-2233",
            esPredeterminada: true,
          },
        ],
      },
    },
  });

  console.log("👥 Usuarios creados (4).");

  // ── Categories + Products + Images ────────────────────────────────────────
  type ProductoCreado = { id: string; nombre: string; sku: string; precio: Prisma.Decimal };
  const productosCreados: ProductoCreado[] = [];

  for (const cat of CATALOGO) {
    const categoria = await prisma.category.create({
      data: {
        nombre: cat.nombre,
        slug: toSlug(cat.nombre),
        descripcion: cat.descripcion,
        imagen: `/categorias/${toSlug(cat.nombre)}.svg`,
      },
    });

    for (const p of cat.productos) {
      const slug = toSlug(p.nombre);
      const producto = await prisma.product.create({
        data: {
          nombre: p.nombre,
          slug,
          descripcion: p.descripcion,
          precio: L(p.precio),
          comparePrice: p.comparePrice ? L(p.comparePrice) : null,
          sku: p.sku,
          stock: p.stock,
          marca: p.marca,
          activo: p.activo ?? true,
          destacado: p.destacado ?? false,
          categoryId: categoria.id,
          images: {
            create: [
              {
                url: `/productos/${slug}.svg`,
                alt: p.nombre,
                orden: 0,
              },
            ],
          },
        },
      });
      productosCreados.push({
        id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio: producto.precio,
      });
    }
  }

  console.log(`📦 ${CATALOGO.length} categorías y ${productosCreados.length} productos creados.`);

  // Index by SKU to build the orders in a readable way.
  const porSku = new Map(productosCreados.map((p) => [p.sku, p]));
  const requerir = (sku: string): ProductoCreado => {
    const prod = porSku.get(sku);
    if (!prod) throw new Error(`Producto con SKU ${sku} no encontrado en el seed.`);
    return prod;
  };

  // ── Snapshot addresses (JSON) for orders ──────────────────────────────────
  const direccionTegucigalpa: Prisma.InputJsonValue = {
    nombre: "María Fernanda López",
    linea1: "Col. Palmira, Calle República de México #245",
    linea2: "Casa color terracota, portón negro",
    ciudad: "Tegucigalpa",
    departamento: "Francisco Morazán",
    telefono: "+504 9988-7766",
  };
  const direccionSanPedro: Prisma.InputJsonValue = {
    nombre: "José Roberto Andino",
    linea1: "Barrio Río de Piedras, Avenida Circunvalación",
    ciudad: "San Pedro Sula",
    departamento: "Cortés",
    telefono: "+504 9911-2233",
  };

  // ── Order generator with correct snapshots ────────────────────────────────
  type LineaPedido = { sku: string; cantidad: number };
  type PedidoSeed = {
    numero: string;
    userId: string;
    estado: OrderStatus;
    direccion: Prisma.InputJsonValue;
    envio: string;
    lineas: LineaPedido[];
    diasAtras: number;
  };

  const pedidos: PedidoSeed[] = [
    {
      numero: "NOVA-2026-0001",
      userId: cliente1.id,
      estado: OrderStatus.ENTREGADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 32,
      lineas: [
        { sku: "ESC-BIC-AZ-12", cantidad: 2 },
        { sku: "CUA-UNI-100-RAY", cantidad: 3 },
        { sku: "GEO-JGO-5P-01", cantidad: 1 },
      ],
    },
    {
      numero: "NOVA-2026-0002",
      userId: cliente1.id,
      estado: OrderStatus.ENVIADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 9,
      lineas: [
        { sku: "ART-PRC-24-01", cantidad: 1 },
        { sku: "ART-BLK-A3-50", cantidad: 1 },
      ],
    },
    {
      numero: "NOVA-2026-0003",
      userId: cliente2.id,
      estado: OrderStatus.PAGADO,
      direccion: direccionSanPedro,
      envio: "75.00",
      diasAtras: 4,
      lineas: [
        { sku: "TEC-USB-64-01", cantidad: 2 },
        { sku: "TEC-MOU-INA-01", cantidad: 1 },
        { sku: "OFI-CAS-991-01", cantidad: 1 },
      ],
    },
    {
      numero: "NOVA-2026-0004",
      userId: cliente2.id,
      estado: OrderStatus.PENDIENTE,
      direccion: direccionSanPedro,
      envio: "75.00",
      diasAtras: 1,
      lineas: [
        { sku: "MOC-ESC-18-01", cantidad: 1 },
        { sku: "MOC-EST-3C-01", cantidad: 2 },
      ],
    },
    {
      numero: "NOVA-2026-0005",
      userId: cliente1.id,
      estado: OrderStatus.CANCELADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 20,
      lineas: [{ sku: "TEC-TI84-GRA-01", cantidad: 1 }],
    },
    {
      numero: "NOVA-2026-0006",
      userId: cliente1.id,
      estado: OrderStatus.ENTREGADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 45,
      lineas: [
        { sku: "CUA-UNI-100-RAY", cantidad: 5 },
        { sku: "ESC-STB-BOSS-6", cantidad: 1 },
        { sku: "OFI-FLD-MAN-25", cantidad: 2 },
      ],
    },
    {
      numero: "NOVA-2026-0007",
      userId: cliente2.id,
      estado: OrderStatus.ENTREGADO,
      direccion: direccionSanPedro,
      envio: "75.00",
      diasAtras: 14,
      lineas: [
        { sku: "TEC-AUD-MIC-01", cantidad: 1 },
        { sku: "TEC-CAB-CC-1M", cantidad: 2 },
      ],
    },
    {
      numero: "NOVA-2026-0008",
      userId: cliente1.id,
      estado: OrderStatus.PAGADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 2,
      lineas: [
        { sku: "MAN-PEG-250-01", cantidad: 3 },
        { sku: "MAN-CRT-COL-50", cantidad: 1 },
        { sku: "MAN-PLA-12-01", cantidad: 2 },
      ],
    },
    {
      numero: "NOVA-2026-0009",
      userId: cliente2.id,
      estado: OrderStatus.ENVIADO,
      direccion: direccionSanPedro,
      envio: "75.00",
      diasAtras: 6,
      lineas: [
        { sku: "OFI-ENG-MET-01", cantidad: 1 },
        { sku: "OFI-GRP-266-5K", cantidad: 3 },
        { sku: "OFI-CNT-TRA-6", cantidad: 2 },
      ],
    },
    {
      numero: "NOVA-2026-0010",
      userId: cliente1.id,
      estado: OrderStatus.ENTREGADO,
      direccion: direccionTegucigalpa,
      envio: "60.00",
      diasAtras: 60,
      lineas: [
        { sku: "ESC-MON-2-12", cantidad: 2 },
        { sku: "GEO-REG-30-01", cantidad: 1 },
        { sku: "GEO-COM-MET-01", cantidad: 1 },
      ],
    },
  ];

  for (const ped of pedidos) {
    let subtotal = new Prisma.Decimal(0);
    const itemsData = ped.lineas.map((linea) => {
      const prod = requerir(linea.sku);
      const importe = prod.precio.mul(linea.cantidad);
      subtotal = subtotal.add(importe);
      return {
        productId: prod.id,
        nombre: prod.nombre, // snapshot
        sku: prod.sku, // snapshot
        precio: prod.precio, // snapshot
        cantidad: linea.cantidad,
      };
    });

    const envio = new Prisma.Decimal(ped.envio);
    const total = subtotal.add(envio);
    const fecha = new Date(Date.now() - ped.diasAtras * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        numero: ped.numero,
        userId: ped.userId,
        estado: ped.estado,
        subtotal,
        envio,
        total,
        direccion: ped.direccion,
        createdAt: fecha,
        items: { create: itemsData },
      },
    });
  }

  console.log(`🧾 ${pedidos.length} pedidos creados con snapshots.`);

  // ── Reviews ────────────────────────────────────────────────────────────────
  const reviews = [
    {
      sku: "CUA-UNI-100-RAY",
      userId: cliente1.id,
      rating: 5,
      comentario: "Excelente calidad, las hojas no se transparentan. Volveré a comprar.",
    },
    {
      sku: "ESC-STB-BOSS-6",
      userId: cliente1.id,
      rating: 4,
      comentario: "Buenos colores, aunque el amarillo es un poco tenue.",
    },
    {
      sku: "TEC-USB-64-01",
      userId: cliente2.id,
      rating: 5,
      comentario: "Muy rápida transfiriendo archivos. Recomendada.",
    },
    {
      sku: "OFI-CAS-991-01",
      userId: cliente2.id,
      rating: 5,
      comentario: "Indispensable para la universidad, funciona perfecto.",
    },
    {
      sku: "ART-PRC-24-01",
      userId: cliente1.id,
      rating: 4,
      comentario: "Pigmento muy bonito, el estuche podría ser más resistente.",
    },
    {
      sku: "MOC-ESC-18-01",
      userId: cliente2.id,
      rating: 5,
      comentario: "Mochila muy cómoda y espaciosa, buen acolchado en la espalda.",
    },
  ];

  for (const r of reviews) {
    const prod = requerir(r.sku);
    await prisma.review.create({
      data: {
        rating: r.rating,
        comentario: r.comentario,
        userId: r.userId,
        productId: prod.id,
      },
    });
  }

  console.log(`⭐ ${reviews.length} reseñas creadas.`);

  // ── Active cart of the demo customer (persistent) ─────────────────────────
  const itemCarrito1 = requerir("ESC-SHR-NG-01");
  const itemCarrito2 = requerir("CUA-CUA-80-5MM");
  await prisma.cart.create({
    data: {
      userId: cliente1.id,
      items: {
        create: [
          { productId: itemCarrito1.id, cantidad: 2, precio: itemCarrito1.precio },
          { productId: itemCarrito2.id, cantidad: 1, precio: itemCarrito2.precio },
        ],
      },
    },
  });
  console.log("🛒 Carrito demo creado para el cliente.");

  console.log("\n✅ Seed completado.");
  console.log("   Usa las credenciales de SOLO-DESARROLLO documentadas para iniciar sesión.");
  // References to avoid unused-variable warnings (admin/vendedor exist in the DB).
  void admin;
  void vendedor;
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
