import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Image, Money } from '@shopify/hydrogen';
import type {
  Metaobject,
  MoneyV2,
} from '@shopify/hydrogen/storefront-api-types';
import LightRays from './LightRays';

interface Product {
  id: string;
  title: string;
  priceRange: {
    minVariantPrice: MoneyV2;
  };
  featuredImage: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  } | null;
  handle: string;
}

interface VisibleProduct extends Product {
  offset: number;
  isActive: boolean;
}

interface ProductCarouselProps {
  metaobject?: Metaobject | null;
}

export function ProductCarousel({ metaobject }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [isMounted, setIsMounted] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // ===== CLIENT-SIDE MOUNT =====
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ===== ERROR HANDLING: Missing Metaobject =====
  if (!metaobject?.fields) {
    return (
      <div className="product-carousel-error">
        <div className="error-content">
          <h1 className="error-title">⚠️ Metaobject Not Found</h1>
          <p className="error-description">
            Could not load product showcase data
          </p>
          <div className="error-instructions">
            <h3>Required Steps:</h3>
            <ol>
              <li>
                Go to{' '}
                <strong>
                  Shopify Admin → Settings → Custom Data → Metaobjects
                </strong>
              </li>
              <li>
                Find <strong>"Section Product Showcase"</strong>
              </li>
              <li>
                <strong style={{ color: '#ffa500' }}>
                  Enable "Storefront access" ✅
                </strong>
              </li>
              <li>
                Create entry with handle:{' '}
                <code className="error-code">our-products</code>
              </li>
              <li>Add heading and select products</li>
              <li>Save and refresh</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ===== FIELD EXTRACTORS (Memoized) =====
  const getFieldValue = useCallback(
    (key: string): string => {
      return metaobject.fields?.find((f) => f?.key === key)?.value || '';
    },
    [metaobject.fields],
  );

  const getFieldReferences = useCallback(
    (key: string): any[] => {
      const field = metaobject.fields?.find((f) => f?.key === key);
      return field?.references?.nodes || [];
    },
    [metaobject.fields],
  );

  // ===== EXTRACT DATA =====
  const heading = useMemo(
    () => getFieldValue('heading') || 'Our Featured Products',
    [getFieldValue],
  );

  const productNodes = useMemo(
    () => getFieldReferences('products'),
    [getFieldReferences],
  );

  // ===== PROCESS PRODUCTS (Memoized) =====
  const products: Product[] = useMemo(() => {
    return productNodes
      .filter((node: any) => node?.id && node?.title && node?.priceRange)
      .map((product: any) => ({
        id: product.id,
        title: product.title,
        priceRange: {
          minVariantPrice: {
            amount: product.priceRange.minVariantPrice.amount,
            currencyCode: product.priceRange.minVariantPrice.currencyCode,
          } as MoneyV2,
        },
        featuredImage: product.featuredImage || null,
        handle: product.handle,
      }));
  }, [productNodes]);

  // ===== ERROR HANDLING: No Products =====
  if (products.length === 0) {
    return (
      <div className="product-carousel-empty">
        <h1 className="empty-title">⚠️ No Products Selected</h1>
        <p className="empty-description">
          Metaobject "{metaobject.handle}" has no products
        </p>
      </div>
    );
  }

  // ===== SMOOTH SCROLL-BASED PRODUCT SWITCHING =====
  useEffect(() => {
    if (!sectionRef.current || products.length === 0) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;

      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;
      setScrollDirection(direction);

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;

      if (sectionTop < windowHeight && sectionTop + sectionHeight > 0) {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        scrollTimeout.current = setTimeout(() => {
          setCurrentIndex((prev) => {
            setPrevIndex(prev);
            if (direction === 'down') {
              return (prev + 1) % products.length;
            } else {
              return prev === 0 ? products.length - 1 : prev - 1;
            }
          });
        }, 50);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [products.length, scrollDirection]);

  // ===== NAVIGATION HANDLERS =====
  const handlePrevious = useCallback(() => {
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  }, [currentIndex, products.length]);

  const handleNext = useCallback(() => {
    setPrevIndex(currentIndex);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [currentIndex, products.length]);

  // ===== GET VISIBLE PRODUCTS (5 items for carousel) =====
  const visibleProducts: VisibleProduct[] = useMemo(() => {
    const visible: VisibleProduct[] = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + products.length) % products.length;
      visible.push({
        ...products[index],
        offset: i,
        isActive: i === 0,
      });
    }
    return visible;
  }, [currentIndex, products]);

  const centerProduct = products[currentIndex];

  return (
    <>
      <section ref={sectionRef} className="product-carousel-section">
        {/* Grid Background */}
        <div className="grid-background" />

        {/* LightRays Effect */}
        {isMounted && (
          <div className="lightrays-container">
            <LightRays
              raysOrigin="top-center"
              raysColor="#ffffff"
              raysSpeed={1.5}
              lightSpread={0.9}
              rayLength={1.8}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0.1}
              distortion={0.05}
            />
          </div>
        )}

        <div className="carousel-content">
          {/* Section Heading */}
          <h1 className="carousel-heading">{heading}</h1>

          {/* Products Display */}
          <div className="products-container-infinite">
            {visibleProducts.map((product, idx) => {
              const absOffset = Math.abs(product.offset);

              return (
                <div
                  key={`${product.id}-${idx}-${currentIndex}`}
                  className={`product-item-infinite ${product.isActive ? 'active fade-in-center center-pulse' : ''}`}
                  style={{
                    transform: `translateX(${product.offset * 320}px) scale(${product.isActive ? 1 : 0.7})`,
                    opacity: product.isActive
                      ? 1
                      : absOffset === 1
                        ? 0.5
                        : 0.3,
                    zIndex: 5 - absOffset,
                  }}
                >
                  {product.featuredImage ? (
                    <Image
                      data={product.featuredImage}
                      sizes="(min-width: 768px) 400px, 240px"
                      loading={product.isActive ? 'eager' : 'lazy'}
                      className="product-image-carousel"
                    />
                  ) : (
                    <div className="product-placeholder">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Product Info Card with Arrows */}
          {centerProduct && (
            <div className="product-info-wrapper">
              {/* Left Arrow */}
              <button
                className="nav-arrow nav-arrow-left-info"
                onClick={handlePrevious}
                aria-label="Previous product"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Product Info Card */}
              <div className="product-info-card">
                <h2 className="product-title-card">{centerProduct.title}</h2>
                <div className="product-price-card">
                  <Money data={centerProduct.priceRange.minVariantPrice} />
                </div>
                <a
                  href={`/products/${centerProduct.handle}`}
                  className="explore-link"
                >
                  <button className="explore-button-card">
                    <span className="button-text">Explore</span>
                  </button>
                </a>
              </div>

              {/* Right Arrow */}
              <button
                className="nav-arrow nav-arrow-right-info"
                onClick={handleNext}
                aria-label="Next product"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ===== PRODUCT CAROUSEL SECTION ===== */
        .product-carousel-section {
          position: relative;
          width: 100%;
          min-height: 150vh;
          background: #0a0a0a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }

        /* Grid Background */
        .grid-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 1;
          pointer-events: none;
        }

        /* LightRays Container */
        .lightrays-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
          opacity: 0.7;
          mix-blend-mode: screen;
        }

        /* Content */
        .carousel-content {
          position: sticky;
          top: 8vh;
          z-index: 10;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Carousel Heading */
        .carousel-heading {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          color: #ffffff;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
        }

        /* Products Container */
        .products-container-infinite {
          position: relative;
          height: 480px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1500px;
          margin-bottom: 2rem;
        }

        .product-item-infinite {
          position: absolute;
          width: 300px;
          height: 300px;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform, opacity;
          border-radius: 0;
          overflow: hidden;
          background: transparent;
        }

        .product-item-infinite.active {
          width: 400px;
          height: 400px;
        }

        .product-image-carousel {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          color: #666;
        }

        /* Fade-in Animation */
        .fade-in-center {
          animation: fadeInScale 0.6s ease-out forwards;
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Center Product Pulse */
        .center-pulse {
          animation: centerPulseGlow 2.5s ease-in-out infinite;
          position: relative;
        }

        .center-pulse::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 110%;
          height: 110%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          animation: pulseRing 2.5s ease-in-out infinite;
          z-index: -1;
          pointer-events: none;
        }

        @keyframes centerPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 25px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(255,255,255,0.3));
            transform: scale(1.03);
          }
        }

        @keyframes pulseRing {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        /* Product Info Wrapper */
        .product-info-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Navigation Arrows */
        .nav-arrow {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
          transition: all 0.3s ease;
          z-index: 100;
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .nav-arrow:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        /* Product Info Card */
        .product-info-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem 2rem;
          text-align: center;
          flex: 1;
          max-width: 500px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .product-title-card {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .product-price-card {
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }

        .explore-link {
          text-decoration: none;
          display: block;
        }

        /* ===== EXPLORE BUTTON ===== */
        .explore-button-card {
          position: relative;
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #ffffff;
          background-color: #000000;
          border: 2px solid #000000;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          z-index: 1;
          transition: color 0.5s ease;
        }

        .button-text {
          position: relative;
          z-index: 2;
          transition: color 0.5s ease;
        }

        .explore-button-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #ffffff;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 1;
        }

        .explore-button-card:hover::before {
          transform: scaleX(1);
        }

        .explore-button-card:hover .button-text {
          color: #000000;
        }

        .explore-button-card:active {
          transform: translateY(2px);
        }

        /* Error States */
        .product-carousel-error,
        .product-carousel-empty {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          color: white;
          padding: 2rem;
          text-align: center;
        }

        .error-title,
        .empty-title {
          font-size: 2.5rem;
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .error-description,
        .empty-description {
          font-size: 1.2rem;
          color: #999;
          margin-bottom: 2rem;
        }

        .error-instructions {
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 12px;
          max-width: 600px;
          text-align: left;
        }

        .error-instructions h3 {
          color: #4CAF50;
          margin-bottom: 1rem;
        }

        .error-instructions ol {
          line-height: 2;
          padding-left: 1.5rem;
        }

        .error-code {
          background: rgba(0,0,0,0.5);
          padding: 4px 8px;
          border-radius: 4px;
        }

        /* ===== MOBILE - ABSOLUTE MINIMUM TOP SPACING ===== */
        @media (max-width: 768px) {
          .product-carousel-section {
            min-height: 100vh;
            padding: 0; /* ✅ ZERO section padding */
          }

          /* ✅ ABSOLUTE TOP - No sticky positioning */
          .carousel-content {
            position: relative; /* ✅ Changed from sticky */
            top: auto; /* ✅ No offset */
            padding: 0.25rem 0.75rem 0 0.75rem; /* ✅ Minimal top padding (0.25rem) */
            margin-top: 0; /* ✅ No margin */
          }

          /* ✅ Ultra-compact heading */
          .carousel-heading {
            font-size: 0.85rem; /* ✅ Smaller */
            margin-bottom: 0.25rem; /* ✅ Minimal spacing */
            letter-spacing: 0.8px;
            padding-top: 0; /* ✅ No padding */
          }

          /* ✅ Products pushed up */
          .products-container-infinite {
            height: 200px; /* ✅ Reduced from 220px */
            margin-bottom: 0.5rem; /* ✅ Minimal spacing */
            margin-top: 0; /* ✅ No top margin */
          }

          /* ✅ Smaller products for 3-visible layout */
          .product-item-infinite {
            width: 95px; /* ✅ Slightly smaller from 100px */
            height: 95px;
          }

          .product-item-infinite.active {
            width: 200px; /* ✅ Slightly smaller from 150px */
            height: 200px;
          }

          .grid-background {
            background-size: 25px 25px;
          }

          /* ✅ Maximum light rays visibility */
          .lightrays-container {
            opacity: 0.95; /* ✅ Even brighter from 0.9 */
          }

          .product-info-wrapper {
            gap: 0.4rem;
            margin-top: 0; /* ✅ No top margin */
          }

          .nav-arrow {
            width: 30px; /* ✅ Smaller */
            height: 30px;
          }

          .nav-arrow svg {
            width: 14px;
            height: 14px;
          }

          .product-info-card {
            padding: 0.75rem 0.85rem; /* ✅ Ultra-compact */
          }

          .product-title-card {
            font-size: 0.9rem; /* ✅ Smaller */
            margin-bottom: 0.3rem;
          }

          .product-price-card {
            font-size: 0.85rem; /* ✅ Smaller */
            margin-bottom: 0.6rem;
          }

          .explore-button-card {
            padding: 0.6rem 0.9rem; /* ✅ Compact */
            font-size: 0.75rem; /* ✅ Smaller */
          }
        }

        /* Tablet - DESKTOP UNCHANGED */
        @media (min-width: 769px) and (max-width: 1024px) {
          .carousel-heading {
            font-size: 1.4rem;
          }

          .products-container-infinite {
            height: 400px;
          }

          .product-item-infinite {
            width: 240px;
            height: 240px;
          }

          .product-item-infinite.active {
            width: 340px;
            height: 340px;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .product-item-infinite,
          .nav-arrow,
          .explore-button-card,
          .fade-in-center,
          .center-pulse {
            animation: none;
            transition: none;
          }
          .center-pulse::before {
            animation: none;
          }
          .explore-button-card::before {
            transition: none;
          }
        }
      `,
        }}
      />
    </>
  );
}
