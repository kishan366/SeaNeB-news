import homeData from '@/data/home.json';

export const metadata = {
  title: homeData.seo.title,
  description: homeData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${homeData.slug}`,
  },
};

export default function HomeLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeData.structuredData) }}
      />
      {children}
    </>
  );
}
