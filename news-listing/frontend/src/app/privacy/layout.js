import privacyData from '@/data/privacy-data.json';

export const metadata = {
  title: privacyData.seo.title,
  description: privacyData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${privacyData.slug}`,
  },
};

export default function PrivacyLayout({ children }) {
  return <>{children}</>;
}
