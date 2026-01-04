import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { getSeoMeta } from '@shopify/hydrogen';

import { HeroParallax } from '~/components/HeroParallax';
import { ProductCarousel } from '~/components/ProductCarousel';
import { ReviewsSection } from '~/components/ReviewSection';
import { HERO_PARALLAX_QUERY } from '~/graphql/hero.query';
import { PRODUCT_SHOWCASE_QUERY } from '~/graphql/product.query';
import { REVIEWS_SECTION_QUERY } from '~/graphql/reviews.query';
import { seoPayload } from '~/lib/seo.server';
import { routeHeaders } from '~/data/cache';

export const headers = routeHeaders;

// ===== TYPES =====
interface LoaderData {
  shop: {
    name: string;
    description: string;
  };
  heroParallax: any;
  productShowcase: any;
  reviewsSection: any;
  seo: any;
}

// ===== LOADER =====
export async function loader(args: LoaderFunctionArgs) {
  const { params, context } = args;
  const { language, country } = context.storefront.i18n;

  // Validate locale
  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, { status: 404 });
  }

  try {
    const criticalData = await loadCriticalData(args);
    return defer({ ...criticalData });
  } catch (error) {
    console.error('[Homepage Loader] Critical error:', error);
    // Return minimal data to prevent complete page failure
    return defer({
      shop: { name: 'Store', description: '' },
      heroParallax: null,
      productShowcase: null,
      reviewsSection: null,
      seo: seoPayload.home({ url: args.request.url }),
    });
  }
}

// ===== LOAD CRITICAL DATA =====
async function loadCriticalData({
  context,
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  try {
    // Execute all queries in parallel with individual error handling
    const [shopResult, heroResult, productResult, reviewsResult] =
      await Promise.allSettled([
        context.storefront.query(HOMEPAGE_SEO_QUERY),
        context.storefront.query(HERO_PARALLAX_QUERY, {
          variables: { handle: 'welcome-to-sneaker-store' },
        }),
        context.storefront.query(PRODUCT_SHOWCASE_QUERY, {
          variables: { handle: 'our-products' },
        }),
        context.storefront.query(REVIEWS_SECTION_QUERY, {
          variables: { handle: 'what-our-customers-say' },
        }),
      ]);

    // Extract results with fallbacks
    const shop =
      shopResult.status === 'fulfilled' && shopResult.value?.shop
        ? shopResult.value.shop
        : { name: 'Store', description: '' };

    const heroParallax =
      heroResult.status === 'fulfilled' && heroResult.value?.metaobject
        ? heroResult.value.metaobject
        : null;

    const productShowcase =
      productResult.status === 'fulfilled' && productResult.value?.metaobject
        ? productResult.value.metaobject
        : null;

    const reviewsSection =
      reviewsResult.status === 'fulfilled' && reviewsResult.value?.metaobject
        ? reviewsResult.value.metaobject
        : null;

    // Log results for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Shop Data:', shop ? 'SUCCESS' : 'FAILED');
      console.log(
        '✅ Hero Parallax:',
        heroParallax ? 'SUCCESS' : 'FAILED',
      );
      console.log(
        '✅ Product Showcase:',
        productShowcase ? 'SUCCESS' : 'FAILED',
      );
      console.log(
        '✅ Reviews Section:',
        reviewsSection ? 'SUCCESS' : 'FAILED',
      );

      // Log errors if any
      if (shopResult.status === 'rejected') {
        console.error('[Shop Query] Error:', shopResult.reason);
      }
      if (heroResult.status === 'rejected') {
        console.error('[Hero Parallax Query] Error:', heroResult.reason);
      }
      if (productResult.status === 'rejected') {
        console.error('[Product Showcase Query] Error:', productResult.reason);
      }
      if (reviewsResult.status === 'rejected') {
        console.error('[Reviews Section Query] Error:', reviewsResult.reason);
      }
    }

    return {
      shop,
      heroParallax,
      productShowcase,
      reviewsSection,
      seo: seoPayload.home({ url: request.url }),
    };
  } catch (error) {
    console.error('[loadCriticalData] Unexpected error:', error);
    throw error; // Re-throw to be caught by loader
  }
}

// ===== META =====
export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

// ===== COMPONENT =====
export default function Homepage() {
  const { heroParallax, productShowcase, reviewsSection } =
    useLoaderData<typeof loader>();

  return (
    <div className="homepage-container">
      {/* 1. Hero Parallax Section */}
      {heroParallax ? (
        <HeroParallax metaobject={heroParallax} />
      ) : (
        <div className="section-placeholder">
          <p>Hero section loading...</p>
        </div>
      )}

      {/* 2. Product Carousel Section with LightRays */}
      {productShowcase ? (
        <ProductCarousel metaobject={productShowcase} />
      ) : (
        <div className="section-placeholder">
          <p>Products loading...</p>
        </div>
      )}

      {/* 3. Reviews Section - Infinite Vertical Scroll */}
      {reviewsSection ? (
        <ReviewsSection metaobject={reviewsSection} />
      ) : (
        <div className="section-placeholder">
          <p>Reviews loading...</p>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .homepage-container {
          width: 100%;
          overflow-x: hidden;
        }

        .section-placeholder {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          color: #999;
          font-size: 1.2rem;
        }
      `,
        }}
      />
    </div>
  );
}

// ===== GRAPHQL QUERIES =====
const HOMEPAGE_SEO_QUERY = `#graphql
  query HomepageSeo {
    shop {
      name
      description
    }
  }
` as const;
