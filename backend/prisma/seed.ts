import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const prisma = new PrismaClient({ adapter });

  const password = await bcrypt.hash(
    'User2@123',
    10,
  );

  const user = await prisma.user.upsert({
    where: {
      email: 'user2@codesphere.test',
    },
    update: {
      emailVerified: true,
    },
    create: {
      name: 'CodeSphere User 2',
      email: 'user2@codesphere.test',
      password,
      emailVerified: true,
    },
  });

  console.log('Second test user created:');
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});