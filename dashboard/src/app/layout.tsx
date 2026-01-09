import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse Forge Analytics",
  description: "Game Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
