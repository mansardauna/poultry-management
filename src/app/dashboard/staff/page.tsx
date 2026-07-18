'use strict';
import { supabase } from "@/lib/supabase";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { cookies } from 'next/headers';

/** Exported function default */
export default async function StaffPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';

  const [staffRaw, tasksRaw] = await Promise.all([
    supabase.from('staff').select('*'),
    supabase.from('tasks').select('*')
  ]);
  const staff = (staffRaw.data || []) as Staff[];
  const tasks = (tasksRaw.data || []) as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
    />
  );
}
