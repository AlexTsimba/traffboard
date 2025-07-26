import { redirect } from 'next/navigation';

export default function GeneralSettingsPage() {
  // Redirect to new user settings preferences
  redirect('/settings/user/preferences');
}