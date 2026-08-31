import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const approveAll = process.argv.includes('--approve');
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isApproved: true,
      isOpen: true,
      owner: { select: { email: true, role: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Restaurants in database:');
  for (const r of restaurants) {
    console.log(
      `- ${r.name} (${r.slug}) | approved=${r.isApproved} | open=${r.isOpen} | owner=${r.owner.email} [${r.owner.role}]`,
    );
  }

  if (approveAll) {
    const result = await prisma.restaurant.updateMany({
      where: { isApproved: false },
      data: { isApproved: true, isOpen: true },
    });
    console.log(`\nApproved ${result.count} restaurant(s).`);
  } else {
    const pending = restaurants.filter((r) => !r.isApproved).length;
    if (pending > 0) {
      console.log(
        `\n${pending} restaurant(s) pending approval. Run: npm run approve-restaurants`,
      );
    }
  }

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
