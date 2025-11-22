import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = 'QuizGod - Free Online Quizzes, AI Quiz Generator, Multiplayer',
  description = 'Create, play, and share quizzes. AI-powered quiz generator, multiplayer, and more. Boost your learning with QuizGod!',
  canonical,
  image = '/logo.png',
  url = 'https://quizgod-swart.vercel.app',
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Head>
  );
}
