import { db } from "../src/lib/drizzle";
import * as schema from "../src/lib/schema";

async function run() {
  const fridayDate = "2026-06-26";
  const saturdayDate = "2026-06-27";

  // Check if a batch exists, if not create one
  let batches = await db.select().from(schema.batches);
  let batchId = "BCH-1";
  if (batches.length === 0) {
    await db.insert(schema.batches).values({
      id: batchId,
      breed: "Isa Brown",
      quantity: 1000,
      purchaseDate: "2026-01-01",
      ageInWeeks: 25,
      mortalityCount: 0,
      vaccinationStatus: "Up to date",
      farmSection: "Pen A",
      type: "Layers",
      unitPurchasePrice: 1500,
      projectedSellingPrice: 4500,
    });
  } else {
    batchId = batches[0].id;
  }

  // Insert Friday Eggs (3 crates + 14 pieces = 104 pieces)
  await db.insert(schema.eggs).values({
    id: `EGG-${Date.now()}-fri`,
    date: fridayDate,
    goodEggs: 104,
    brokenEggs: 0,
    spoiltEggs: 0,
    batchId: batchId,
  });

  // Insert Friday Sales (7 crates @ 4300 = 30100)
  await db.insert(schema.sales).values({
    id: `SAL-${Date.now()}-fri`,
    date: fridayDate,
    type: "Eggs",
    quantity: 7,
    totalAmount: 30100,
    customerName: "Walk-in Customer",
    paymentMethod: "Cash",
    status: "Paid",
  });

  // Insert Saturday Eggs (3 crates + 22 pieces = 112 pieces)
  await db.insert(schema.eggs).values({
    id: `EGG-${Date.now()}-sat`,
    date: saturdayDate,
    goodEggs: 112,
    brokenEggs: 0,
    spoiltEggs: 0,
    batchId: batchId,
  });

  // Insert Saturday Sales (3 crates @ 4200 = 12600)
  await db.insert(schema.sales).values({
    id: `SAL-${Date.now()}-sat`,
    date: saturdayDate,
    type: "Eggs",
    quantity: 3,
    totalAmount: 12600,
    customerName: "Walk-in Customer",
    paymentMethod: "Cash",
    status: "Paid",
  });

  // Insert Saturday Expenses
  await db.insert(schema.expenses).values([
    {
      id: `EXP-${Date.now()}-feed`,
      date: saturdayDate,
      category: "Feed",
      amount: 154000,
      description: "13.5 bags of feed",
    },
    {
      id: `EXP-${Date.now()}-trans`,
      date: saturdayDate,
      category: "Maintenance",
      amount: 7000,
      description: "Transport for feed",
    },
    {
      id: `EXP-${Date.now()}-fuel`,
      date: saturdayDate,
      category: "Utilities",
      amount: 2000,
      description: "Fuel",
    }
  ]);

  // Insert Saturday Feed Inventory (Assuming 1 bag = 25kg, 13.5 bags = 337.5kg)
  await db.insert(schema.feeds).values({
    id: `FEED-${Date.now()}`,
    type: "Layer mash",
    quantityKg: 337.5,
    supplier: "Local Market",
    lastRestock: saturdayDate,
  });

  console.log("Data inserted successfully");
}

run().catch(console.error);
