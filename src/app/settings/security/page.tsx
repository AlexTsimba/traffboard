import { redirect } from 'next/navigation';

export default function SecuritySettingsPage() {
  // Redirect to new user settings security
  redirect('/settings/user/security');
}