import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { cookies } from 'next/headers';

export default async function StaffPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';
  const staff = (await db.select().from(schema.staff)) as Staff[];
  const tasks = (await db.select().from(schema.tasks)) as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
    />
  );
}
