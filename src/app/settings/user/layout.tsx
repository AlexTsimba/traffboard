export default function UserSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't wrap in ProtectedLayout since parent settings layout already does
  return <>{children}</>;
}