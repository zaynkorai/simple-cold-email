import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Dispatcher",
  description: "Simple email management and dispatch tool powered by Resend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black font-sans">{children}</body>
    </html>
  );
}
