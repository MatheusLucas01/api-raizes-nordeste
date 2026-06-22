import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role, MovementType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter });

const USERS = [
  {
    name: 'Admin Raízes',
    email: 'admin@raizes.com',
    password: 'Admin@123',
    role: Role.ADMIN,
    loyaltyPoints: 0,
  },
  {
    name: 'Gerente Raízes',
    email: 'gerente@raizes.com',
    password: 'Gerente@123',
    role: Role.MANAGER,
    loyaltyPoints: 0,
  },
  {
    name: 'Cozinha Raízes',
    email: 'cozinha@raizes.com',
    password: 'Cozinha@123',
    role: Role.KITCHEN,
    loyaltyPoints: 0,
  },
  {
    name: 'Atendente Raízes',
    email: 'balcao@raizes.com',
    password: 'Balcao@123',
    role: Role.ATTENDANT,
    loyaltyPoints: 0,
  },
  {
    name: 'Cliente Teste',
    email: 'cliente@raizes.com',
    password: 'Cliente@123',
    role: Role.CLIENT,
    loyaltyPoints: 500,
  },
];

const UNITS = [
  { name: 'Filial Recife — Boa Viagem', address: 'Av. Boa Viagem, 1000, Recife/PE' },
  { name: 'Filial Salvador — Pelourinho', address: 'Praça da Sé, 30, Salvador/BA' },
];

const PRODUCTS = [
  {
    name: 'Cuscuz com Carne de Sol',
    description: 'Cuscuz nordestino com carne de sol e manteiga de garrafa.',
    category: 'Pratos',
  },
  {
    name: 'Tapioca de Coco',
    description: 'Tapioca fresquinha recheada com coco ralado.',
    category: 'Lanches',
  },
  {
    name: 'Acarajé',
    description: 'Bolinho frito de feijão fradinho recheado com vatapá e camarão.',
    category: 'Pratos',
  },
  {
    name: 'Suco de Cajá',
    description: 'Suco natural de cajá da terra.',
    category: 'Bebidas',
  },
  {
    name: 'Bolo de Rolo',
    description: 'Doce típico pernambucano.',
    category: 'Sobremesas',
  },
];

// productIndex e unitIndex referem aos arrays acima
const MENU = [
  // Recife
  { productIndex: 0, unitIndex: 0, localPrice: 24.9, initialStock: 50 },
  { productIndex: 1, unitIndex: 0, localPrice: 14.5, initialStock: 80 },
  { productIndex: 2, unitIndex: 0, localPrice: 12.0, initialStock: 40 },
  { productIndex: 3, unitIndex: 0, localPrice: 8.5, initialStock: 100 },
  { productIndex: 4, unitIndex: 0, localPrice: 18.0, initialStock: 30 },
  // Salvador
  { productIndex: 2, unitIndex: 1, localPrice: 15.0, initialStock: 60 },
  { productIndex: 3, unitIndex: 1, localPrice: 9.0, initialStock: 100 },
];

async function main() {
  console.log('🌱 Iniciando seed do banco...\n');

  console.log('👤 Criando usuários...');
  const userIdByEmail = new Map<string, number>();
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { loyaltyPoints: u.loyaltyPoints, role: u.role },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        lgpdConsent: true,
        loyaltyPoints: u.loyaltyPoints,
      },
    });
    userIdByEmail.set(u.email, user.id);
    console.log(`   ✓ ${u.role.padEnd(10)} ${u.email} (id ${user.id})`);
  }
  const adminId = userIdByEmail.get('admin@raizes.com');
  if (!adminId) throw new Error('Admin não foi criado.');

  console.log('\n🏪 Criando unidades...');
  const unitIds: number[] = [];
  for (const u of UNITS) {
    let unit = await prisma.unit.findFirst({ where: { name: u.name } });
    if (!unit) {
      unit = await prisma.unit.create({
        data: { name: u.name, address: u.address, isActive: true },
      });
      console.log(`   ✓ criada: ${unit.name} (id ${unit.id})`);
    } else {
      console.log(`   ↻ existente: ${unit.name} (id ${unit.id})`);
    }
    unitIds.push(unit.id);
  }

  console.log('\n🍽  Criando produtos...');
  const productIds: number[] = [];
  for (const p of PRODUCTS) {
    let product = await prisma.product.findFirst({ where: { name: p.name } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          category: p.category,
          isActive: true,
        },
      });
      console.log(`   ✓ criado: ${product.name} (id ${product.id})`);
    } else {
      console.log(`   ↻ existente: ${product.name} (id ${product.id})`);
    }
    productIds.push(product.id);
  }

  console.log('\n📋 Configurando cardápio das unidades...');
  for (const m of MENU) {
    const productId = productIds[m.productIndex];
    const unitId = unitIds[m.unitIndex];

    const existing = await prisma.productUnit.findUnique({
      where: { productId_unitId: { productId, unitId } },
    });

    if (existing) {
      await prisma.productUnit.update({
        where: { productId_unitId: { productId, unitId } },
        data: {
          localPrice: m.localPrice,
          currentQuantity: m.initialStock,
          isAvailable: true,
        },
      });
      console.log(
        `   ↻ produto ${productId} na unidade ${unitId} — R$ ${m.localPrice}, ${m.initialStock} em estoque`,
      );
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.productUnit.create({
          data: {
            productId,
            unitId,
            localPrice: m.localPrice,
            currentQuantity: m.initialStock,
            isAvailable: true,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId,
            unitId,
            type: MovementType.IN,
            quantity: m.initialStock,
            reason: 'Estoque inicial (seed)',
            userId: adminId,
          },
        });
      });
      console.log(
        `   ✓ produto ${productId} na unidade ${unitId} — R$ ${m.localPrice}, ${m.initialStock} em estoque`,
      );
    }
  }

  console.log('\n✅ Seed concluído.\n');
  console.log('Credenciais de teste:');
  console.log('   ADMIN     : admin@raizes.com   / Admin@123');
  console.log('   MANAGER   : gerente@raizes.com / Gerente@123');
  console.log('   KITCHEN   : cozinha@raizes.com / Cozinha@123');
  console.log('   ATTENDANT : balcao@raizes.com  / Balcao@123');
  console.log('   CLIENT    : cliente@raizes.com / Cliente@123  (500 pontos)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
