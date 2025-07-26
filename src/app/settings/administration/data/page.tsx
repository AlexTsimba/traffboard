import { redirect } from 'next/navigation';

export default function AdministrationDataPage() {
  // Redirect to new admin settings data
  redirect('/settings/admin/data');
}