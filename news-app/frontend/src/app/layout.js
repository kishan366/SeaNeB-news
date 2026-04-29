import { Noto_Sans } from "next/font/google";
import "./globals.css";
import AuthInit from "@/components/AuthInit";
import Script from "next/script";

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
});

export const metadata = {
  title: {
    default: "SeaNeb News",
    template: "%s | SeaNeb News",
  },
  description: "SeaNeb News Platform",
  icons: {
    icon: [{ url: "/assets/logo.png", type: "image/png" }],
    apple: [{ url: "/assets/logo.png" }],
  },
  alternates: {
    canonical: "https://news.seaneb.com/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="afterInteractive"
        />
        <AuthInit />
        {children}
      </body>
    </html>
  );
}