"use client";

import Link from 'next/link';
import { Facebook, Instagram, Youtube, Mail, ArrowUpRight } from 'lucide-react';
import Logo from "@/components/ui/Logo";
import { useLang } from '@/context/LangContext';
import { usePathname } from 'next/navigation';

export default function SimpleFooter() {
  const currentYear = new Date().getFullYear();
  const { t } = useLang();
  const pathname = usePathname();

  if (pathname === "/profile/edit") return null;

  const footerLinks = [
    { name: t.footer?.faqs || 'FAQs', href: '/Faqs' },
    { name: t.footer?.privacy || 'Privacy Policy', href: '/privacy'},
    { name: t.footer?.terms || 'Terms & Conditions', href: '/terms-and-conditions'},
    { name: t.footer?.press || 'Press Kit', href: '/press-kit'},
    { name: t.footer?.partner || 'Partner with us', href: '/partner-with-us'},
  ];

  const socialLinks = [
    { 
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>, 
      href: "https://x.com/newsseaneb", 
      hover: "hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white",
      label: "X" 
    },
    { icon: <Facebook size={18} />, href: "https://www.facebook.com/SeaNeB.Tech/", hover: "hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white", label: "Facebook" },
    { icon: <Instagram size={18} />, href: "https://www.instagram.com/news.seaneb/",  hover: "hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white", label: "Instagram" },
    { icon: <Youtube size={18} />, href: "https://www.youtube.com/@news.seaneb",  hover: "hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white", label: "Youtube" },
    { icon: <Mail size={18} />, href: "mailto:contact@seaneb.com",  hover: "hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white", label: "Mail" },
  ];

  return (
    <footer className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-300 py-12 border-t border-gray-100 dark:border-slate-800">
      <div className="w-full px-6 md:px-16 lg:px-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Left Side: Logo & Social Icons */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <Logo />
            <p className="text-sm text-gray-500 max-w-xs text-center md:text-left">
              {t.footer?.tagline || "Connecting talent with opportunity across the globe."}
            </p>
            
            {/* Social Icons with Borders */}
            <div className="flex flex-wrap justify-center gap-3">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all duration-300 shadow-sm ${social.hover}`}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Vertical Links */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-[12px] font-normal uppercase tracking-[0.2em] text-gray-900 dark:text-white mb-6">
              {t.footer?.navigation || "Quick Navigation"}
            </h3>
            <ul className="flex flex-col items-center md:items-end gap-4">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-[11px] font-normal uppercase tracking-widest text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    {link.name}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal">
            © {currentYear} <span className="text-gray-900 dark:text-white italic">SeaNeB News</span>
          </p>
          
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-normal uppercase tracking-widest text-gray-400 italic">Anand, Gujarat</span>
          </div>
        </div>

      </div>
    </footer>
  );
}