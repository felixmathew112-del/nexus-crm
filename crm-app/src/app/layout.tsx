import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "Pipeline, contacts, and tasks in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex bg-[var(--bg)] text-[var(--text)]">{children}</body>
    </html>
  );
}
