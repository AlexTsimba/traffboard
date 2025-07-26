import { redirect } from 'next/navigation';

export default function AccountSettingsPage() {
  // Redirect to new user settings overview
  redirect('/settings/user/account');
}