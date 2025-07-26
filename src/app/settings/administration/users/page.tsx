import { redirect } from 'next/navigation';

export default function AdministrationUsersPage() {
  // Redirect to new admin settings users
  redirect('/settings/admin/users');
}