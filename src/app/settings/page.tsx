import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redirect to new user settings by default
  redirect('/settings/user/account');
}