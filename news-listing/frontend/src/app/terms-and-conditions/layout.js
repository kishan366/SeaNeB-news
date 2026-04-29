import termsData from '@/data/terms-data.json';

export const metadata = {
  title: termsData.seo.title,
  description: termsData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${termsData.slug}`,
  },
};

export default function TermsLayout({ children }) {
  return <>{children}</>;
}
