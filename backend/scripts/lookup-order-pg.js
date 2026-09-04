require('dotenv').config();
const { Client } = require('pg');

const orderNumber = process.argv[2] || 'YX-MTKFOUEJ-7969';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const orderRes = await client.query(
    `SELECT o.id, o."orderNumber", o.status, o."courierId", o."paymentMethod", o."paymentStatus",
            o."createdAt", r.name AS restaurant_name,
            cu.email AS courier_email, cu."firstName" AS courier_first, cu."lastName" AS courier_last
     FROM "Order" o
     LEFT JOIN "Restaurant" r ON r.id = o."restaurantId"
     LEFT JOIN "User" cu ON cu.id = o."courierId"
     WHERE o."orderNumber" = $1 OR o."orderNumber" LIKE $2`,
    [orderNumber, `%${orderNumber}%`],
  );

  const activeForCouriers = await client.query(
    `SELECT u.id, u.email, u."firstName", u."lastName", c."isOnline",
            (SELECT COUNT(*)::int FROM "Order" ao WHERE ao."courierId" = u.id AND ao.status IN ('PICKED_UP', 'ON_THE_WAY')) AS active_count
     FROM "User" u
     LEFT JOIN "Courier" c ON c."userId" = u.id
     WHERE u.role = 'COURIER'`,
  );

  console.log(
    JSON.stringify(
      {
        orders: orderRes.rows,
        couriers: activeForCouriers.rows,
      },
      null,
      2,
    ),
  );

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
