import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../lib/seo";

const OG_IMAGE = `${SITE_URL}/web-app-manifest-512x512.png`;

type Props = {
  title: string;
  description: string;
  canonicalUrl: string;
  /** Defaults to "website" */
  ogType?: "website" | "article";
};

/**
 * Renders the standard set of SEO meta tags shared across all pages:
 * - <title>
 * - meta description
 * - canonical link
 * - Open Graph: type, url, title, description, locale, image
 * - Twitter card: summary_large_image, title, description, image
 *
 * Page-specific extras (keywords, ld+json, etc.) should be added in a
 * separate <Helmet> block in the page component.
 */
export function PageMeta({ title, description, canonicalUrl, ogType = "website" }: Props) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content="nb_NO" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
