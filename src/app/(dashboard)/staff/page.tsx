'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { cookies } from 'next/headers';

/** Exported function default */
export default async function StaffPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';

  const [staffRaw, tasksRaw] = await Promise.all([
    db.select().from(schema.staff),
    db.select().from(schema.tasks)
  ]);
  const staff = staffRaw as Staff[];
  const tasks = tasksRaw as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
    />
  );
}
