SELECT id, "orderNumber", status, "courierId", "restaurantId", "createdAt"
FROM "Order"
WHERE "orderNumber" = 'YX-MTKFOUEJ-7969'
   OR "orderNumber" LIKE '%7969%';
