import solutionsData from '@/data/solutions.json';

export const metadata = {
  title: solutionsData.seo.title,
  description: solutionsData.seo.description,
  alternates: {
    canonical: 'https://news.seaneb.com/solution',
  },
};

export default function SolutionsLayout({ children }) {
  return <>{children}</>;
}
