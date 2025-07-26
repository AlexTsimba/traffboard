import { redirect } from 'next/navigation';

export default function AdministrationPage() {
  // Redirect to new admin settings users
  redirect('/settings/admin/users');
}