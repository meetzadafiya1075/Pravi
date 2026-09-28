import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "AssetFlow Enterprise - Infrastructure Asset Lifecycle Management",
  description: "Enterprise-grade physical and digital asset lifecycle tracking, maintenance, transfers, and physical audit platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
