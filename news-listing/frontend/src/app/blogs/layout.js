import blogsData from '@/data/blogs.json';

export const metadata = {
  title: blogsData.seo.title,
  description: blogsData.seo.description,
  alternates: {
    canonical: `https://news.seaneb.com${blogsData.slug}`,
  },
};

export default function BlogsLayout({ children }) {
  return <>{children}</>;
}
