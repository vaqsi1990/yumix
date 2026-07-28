import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npx ts-node scripts/make-admin.ts <email> [password]');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const password = process.argv[3];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    await app.close();
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'ADMIN',
      ...(password ? { password: await hash(password, 12) } : {}),
    },
  });

  console.log(`Promoted ${email} to ADMIN`);
  await app.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
