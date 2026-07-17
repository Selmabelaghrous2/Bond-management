import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Nav } from "@/components/Nav";
import { getCurrentUserWithProfile } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Bond Management",
  description: "Plateforme de gestion des émissions obligataires",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserWithProfile();

  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${playfair.variable} min-h-screen bg-white font-sans antialiased`}
      >
        <Nav session={session} />
        {children}
      </body>
    </html>
  );
}
