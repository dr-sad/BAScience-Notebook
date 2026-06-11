import type { Metadata } from "next";
import localFont from "next/font/local";
import { Bebas_Neue, Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { PerformanceProvider } from "@/components/performance/PerformanceProvider";
import { AnswersProvider } from "@/components/answers/AnswersProvider";

// Header font: BebasNeue-Regular
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-header",
});

// Body font: Roboto Slab (default for most text)
const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
});

// UI / questions / buttons: Roboto
const roboto = Roboto({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ui",
});

// Grogg handwriting
const groggFont = localFont({
  src: "./fonts/02GROGGnotes2021.otf",
  display: "swap",
  variable: "--font-grogg",
});



export const metadata: Metadata = {
  title: "Beast Academy Science | Motion",
  description: "Interactive Living Book – Chapter 2: Evidence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={[
          // Default text font for the whole app
          robotoSlab.className,
          // Expose the other fonts as CSS variables
          bebas.variable,
          roboto.variable,
          groggFont.variable,
          "antialiased",
        ].join(" ")}
      >
        <AnswersProvider>
          <PerformanceProvider>{children}</PerformanceProvider>
        </AnswersProvider>
      </body>
    </html>
  );
}
