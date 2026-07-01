import { db } from "../src/lib/drizzle";
import * as schema from "../src/lib/schema";
import crypto from "crypto";

async function run() {
  const wsId = "main";
  const batchId = "batch-1"; 
  
  // 1. Remove all staff and add new staff
  await db.delete(schema.staff);
  
  const managerId = crypto.randomUUID();
  const cleanerId = crypto.randomUUID();
  
  await db.insert(schema.staff).values([
    {
      id: managerId,
      workspaceId: wsId,
      name: "Abdulrahman Monsur",
      role: "Manager",
      contact: "Gaasaka farm Manager",
      salary: 200000,
      hireDate: "2026-06-30",
      attendanceDays: 0,
      status: "Active"
    },
    {
      id: cleanerId,
      workspaceId: wsId,
      name: "Iyawo",
      role: "Cleaner",
      contact: "Gaasaka farm cleaner",
      salary: 30000,
      hireDate: "2026-06-30",
      attendanceDays: 0,
      status: "Active"
    }
  ]);
  console.log("Staff updated.");

  // 2. Log eggs for Sunday (June 28) and Monday (June 29)
  await db.insert(schema.eggs).values([
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      batchId: batchId,
      date: "2026-06-28",
      goodEggs: 90,
      brokenEggs: 0,
      spoiltEggs: 0,
    },
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      batchId: batchId,
      date: "2026-06-29",
      goodEggs: 102,
      brokenEggs: 0,
      spoiltEggs: 0,
    }
  ]);
  console.log("Eggs logged.");

  // 3. Log expenses (fuel 2k, generator 3k, lasota vaccine 3.5k)
  await db.insert(schema.expenses).values([
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      date: "2026-06-30",
      category: "Utilities",
      amount: 2000,
      description: "Fuel"
    },
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      date: "2026-06-30",
      category: "Maintenance",
      amount: 3000,
      description: "Fix generator"
    },
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      date: "2026-06-29",
      category: "Drugs",
      amount: 3500,
      description: "Lasota vaccine"
    }
  ]);
  console.log("Expenses logged.");

  // 4. Log medication schedule for yesterday
  await db.insert(schema.medicationSchedules).values([
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      batchId: batchId,
      medicationName: "Lasota Vaccine",
      type: "Vaccine",
      scheduledDate: "2026-06-29",
      status: "Completed",
      notes: "Administered yesterday"
    }
  ]);
  console.log("Medication logged.");

  // 5. Log Salaries paid today
  await db.insert(schema.expenses).values([
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      date: "2026-06-30",
      category: "Salaries",
      amount: 200000,
      description: "Paid Abdulrahman Monsur (Manager)"
    },
    {
      id: crypto.randomUUID(),
      workspaceId: wsId,
      date: "2026-06-30",
      category: "Salaries",
      amount: 30000,
      description: "Paid Iyawo (Cleaner)"
    }
  ]);
  console.log("Salaries logged.");
  console.log("Done.");
}

run().catch(console.error);
