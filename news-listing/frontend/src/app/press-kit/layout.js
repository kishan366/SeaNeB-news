import presskitData from '@/data/presskit.json';

export const metadata = {
  title: presskitData.seo.title,
  description: presskitData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${presskitData.slug}`,
  },
};

export default function PressKitLayout({ children }) {
  return <>{children}</>;
}
