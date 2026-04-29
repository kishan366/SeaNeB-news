import SimpleFooter from '@/components/ui/SimpleFooter';
import './globals.css';
import Navbar from "@/components/ui/Navbar";
import { LangProvider } from '@/context/LangContext';
import { ThemeProviders } from '@/context/ThemeProvider';
import { Noto_Sans } from 'next/font/google';
import SsoHandler from "@/components/SsoHandler";
import Script from 'next/script';
import { Suspense } from "react";

export const metadata = {
  title: {
    default: "SeaNeb News",
    template: "%s | SeaNeb News",
  },
  description: "Latest news and updates from SeaNeb",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/assets/logo.png", type: "image/png" }
    ],
    apple: [
      { url: "/assets/logo.png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SeaNeb News",
  },
  alternates: {
    canonical: "https://news.seaneb.com/",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Noto Sans Config
const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
});

export default function RootLayout({ children }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-T7B66CR4');`}
        </Script>
        {/* End Google Tag Manager */}
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${notoSans.className} flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-slate-950 transition-colors duration-300`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-T7B66CR4"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <LangProvider>
          <ThemeProviders>

            <Suspense fallback={null}>
              {/* SSO handler */}
              <SsoHandler />

              <Navbar />
            </Suspense>

            <main className="grow flex flex-col w-full">
              {children}
            </main>

            <SimpleFooter />

          </ThemeProviders>
        </LangProvider>

      </body>
    </html>
  );
}