import aboutData from '@/data/about.json';

export const metadata = {
  title: aboutData.seo.title,
  description: aboutData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${aboutData.slug}`,
  },
};

export default function AboutLayout({ children }) {
  return <>{children}</>;
}
