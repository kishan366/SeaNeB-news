import partnerData from '@/data/partner-with-us.json';

export const metadata = {
  title: partnerData.seo.title,
  description: partnerData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${partnerData.slug}`,
  },
};

export default function PartnerLayout({ children }) {
  return <>{children}</>;
}
