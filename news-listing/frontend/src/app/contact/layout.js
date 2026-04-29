import contactData from '@/data/contact.json';

export const metadata = {
  title: contactData.seo.title,
  description: contactData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${contactData.slug}`,
  },
};

export default function ContactLayout({ children }) {
  return <>{children}</>;
}
