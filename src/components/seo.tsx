import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  image?: string;
  category?: string;
}

export function SEO({ title, description, keywords, path, image, category }: SEOProps) {
  const fullTitle = `${title} - Qiao Tools 免费在线工具`;
  const url = `https://qiaotools.com${path}`;
  const ogImage = image ? `https://qiaotools.com${image}` : 'https://qiaotools.com/qiao-tools.svg';

  // 简单的分类映射
  const getApplicationCategory = (cat?: string) => {
    switch (cat) {
      case 'image':
        return 'MultimediaApplication';
      case 'dev':
      case 'css':
        return 'DeveloperApplication';
      case 'text':
        return 'UtilitiesApplication';
      default:
        return 'WebApplication';
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': fullTitle,
    'description': description,
    'url': url,
    'applicationCategory': getApplicationCategory(category),
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'CNY',
    },
    'author': {
      '@type': 'Person',
      'name': 'Qiao Tools',
    },
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
