import { HousingClient } from "@/components/features/housing/HousingClient";
import { cookies } from "next/headers";

export default async function HousingPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  return <HousingClient role={role} />;
}
