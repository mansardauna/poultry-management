'use strict';
import { supabase } from "@/lib/supabase";
import { ChickensClient } from "@/components/features/chickens/ChickensClient";
import type { ChickenBatch } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function ChickensPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';
  const batches = (await supabase.from('batches').select('*')).data as ChickenBatch[] || [];

  return <ChickensClient initialData={batches} role={role} />;
}
