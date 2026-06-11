import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { ChickensClient } from "@/components/features/chickens/ChickensClient";
import type { ChickenBatch } from "@/data/types";

import { cookies } from 'next/headers';

export default async function ChickensPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';
  const batches = (await db.select().from(schema.batches)) as ChickenBatch[];

  return <ChickensClient initialData={batches} role={role} />;
}
