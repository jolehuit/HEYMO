import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeyMo by Alan — AI Health Follow-up",
  description:
    "Proactive voice AI agent that calls members for post-consultation health follow-up.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
