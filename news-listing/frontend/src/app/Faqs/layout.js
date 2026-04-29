import faqsData from '@/data/faqs.json';

export const metadata = {
  title: faqsData.seo.title,
  description: faqsData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${faqsData.slug}`,
  },
};

export default function FaqsLayout({ children }) {
  return <>{children}</>;
}
