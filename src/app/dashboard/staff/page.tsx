'use strict';
import { supabase } from "@/lib/supabase";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
import { headers, cookies } from 'next/headers';

export default async function StaffPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();
  const reqHeaders = await headers();
  const cookieStore = await cookies();
  const tier = reqHeaders.get('x-user-tier') || cookieStore.get('pfms_tier')?.value || 'free';

  const [staffRaw, tasksRaw] = await Promise.all([
    supabase.from('staff').select('*').eq('workspaceId', workspaceId),
    supabase.from('tasks').select('*').eq('workspaceId', workspaceId)
  ]);
  const staff = (staffRaw.data || []) as Staff[];
  const tasks = (tasksRaw.data || []) as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
      tier={tier}
    />
  );
}
