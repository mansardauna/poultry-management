'use strict';
import { ContactsClient } from "@/components/features/contacts/ContactsClient";
import { cookies } from "next/headers";

/** Exported function default */
export default async function ContactsPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  return <ContactsClient role={role} />;
}
