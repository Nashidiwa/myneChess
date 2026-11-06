import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password
  const passwordHash = await bcrypt.hash('PlayerPass123!', 10);
  const adminHash = await bcrypt.hash('AdminSecurePass123!', 10);

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@onlinechess.local',
      passwordHash: adminHash,
      role: 'ADMIN',
      eloRating: 2000,
      accountStatus: 'ACTIVE',
    },
  });
  console.log('✅ Admin user seeded:', admin.username);

  // Seed Test Players
  const playersData = [
    { username: 'magnus_fan', email: 'magnus@chess.local', rating: 1950 },
    { username: 'hikaru_speed', email: 'hikaru@chess.local', rating: 1880 },
    { username: 'vietnam_grandmaster', email: 'vngm@chess.local', rating: 1720 },
    { username: 'tactics_learner', email: 'tactics@chess.local', rating: 1350 },
    { username: 'rookie_player', email: 'rookie@chess.local', rating: 1150 },
  ];

  for (const p of playersData) {
    const user = await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: {
        username: p.username,
        email: p.email,
        passwordHash,
        role: 'PLAYER',
        eloRating: p.rating,
        accountStatus: 'ACTIVE',
      },
    });
    console.log(`✅ Player seeded: ${user.username} (${user.eloRating} ELO)`);
  }

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
