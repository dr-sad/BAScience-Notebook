import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-header",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Canopy",
  description: "Compete for sunlight in this game for two.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={[
          robotoSlab.className,
          bebas.variable,
          roboto.variable,
          "antialiased",
          "min-h-screen",
          "bg-stone-50",
          "text-stone-800",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
