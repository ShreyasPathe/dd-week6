import { Image } from '@shopify/hydrogen';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type {
  Metaobject,
  Image as ImageType,
} from '@shopify/hydrogen/storefront-api-types';

interface HeroParallaxProps {
  metaobject: Metaobject;
}

export function HeroParallax({ metaobject }: HeroParallaxProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // ===== FIELD EXTRACTORS (Memoized) =====
  const getFieldValue = useCallback(
    (key: string): string => {
      return metaobject.fields?.find((f) => f?.key === key)?.value || '';
    },
    [metaobject.fields],
  );

  const getFieldReference = useCallback(
    (key: string): any => {
      return metaobject.fields?.find((f) => f?.key === key)?.reference;
    },
    [metaobject.fields],
  );

  // ===== EXTRACT FIELDS (Memoized) =====
  const heading = useMemo(() => getFieldValue('heading'), [getFieldValue]);
  const subheading = useMemo(() => getFieldValue('subheading'), [getFieldValue]);
  const ctaText = useMemo(() => getFieldValue('cta_text'), [getFieldValue]);
  const ctaUrl = useMemo(() => getFieldValue('cta_url_new'), [getFieldValue]);

  // ===== EXTRACT AND TYPE BACKGROUND IMAGE (Fixed) =====
  const backgroundImageReference = useMemo(
    () => getFieldReference('background_image'),
    [getFieldReference],
  );

  const backgroundImage: ImageType | null = useMemo(() => {
    if (
      backgroundImageReference &&
      'image' in backgroundImageReference &&
      backgroundImageReference.image
    ) {
      return {
        url: backgroundImageReference.image.url,
        altText: backgroundImageReference.image.altText || '',
        width: backgroundImageReference.image.width,
        height: backgroundImageReference.image.height,
      } as ImageType;
    }
    return null;
  }, [backgroundImageReference]);

  // ===== FORMAT TEXT WITH LINE BREAKS (Memoized) =====
  const formattedHeading = useMemo(
    () => heading.replace('WELCOME TO THE', 'WELCOME TO THE<br>'),
    [heading],
  );

  const formattedSubheading = useMemo(
    () =>
      subheading.replace(
        'Premium footwear for the modern athlete.',
        'Premium footwear for the modern athlete.<br>',
      ),
    [subheading],
  );

  // ===== CLIENT-SIDE MOUNT =====
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ===== MOBILE DETECTION (Debounced) =====
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    checkMobile();
    window.addEventListener('resize', debouncedCheck);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCheck);
    };
  }, []);

  // ===== PARALLAX SCROLL EFFECT (Optimized) =====
  useEffect(() => {
    if (isMobile) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;

        if (bgRef.current) {
          bgRef.current.style.transform = `translate3d(0, ${scrolled * 0.5}px, 0)`;
        }

        if (contentRef.current) {
          contentRef.current.style.transform = `translate3d(0, ${scrolled * 0.2}px, 0)`;
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isMobile]);

  return (
    <>
      <section ref={sectionRef} className="hero-parallax-section-custom">
        {/* Background Layer with Image */}
        {backgroundImage && (
          <div
            ref={bgRef}
            className={`parallax-bg-layer-custom ${isMounted ? 'bg-animate-custom' : 'bg-initial-custom'}`}
          >
            <Image
              data={backgroundImage}
              sizes="100vw"
              loading="eager"
              className="hero-bg-image-custom"
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className={`gradient-overlay-custom ${isMounted ? 'overlay-animate-custom' : 'overlay-initial-custom'}`}
        />

        {/* Content Layer */}
        <div ref={contentRef} className="parallax-content-layer-custom">
          {/* Heading */}
          {heading && (
            <h1
              className={`hero-heading-custom ${isMounted ? 'hero-heading-animate-custom' : 'hero-heading-initial-custom'}`}
              dangerouslySetInnerHTML={{ __html: formattedHeading }}
            />
          )}

          {/* Subheading */}
          {subheading && (
            <p
              className={`hero-subheading-custom ${isMounted ? 'hero-subheading-animate-custom' : 'hero-subheading-initial-custom'}`}
              dangerouslySetInnerHTML={{ __html: formattedSubheading }}
            />
          )}

          {/* CTA Button */}
          {ctaText && ctaUrl && (
            <div
              className={`hero-cta-custom ${isMounted ? 'hero-cta-animate-custom' : 'hero-cta-initial-custom'}`}
            >
              <a href={ctaUrl} className="hero-cta-button-custom">
                <span className="button-text-custom">{ctaText}</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* INLINE STYLES */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ===== BUTTON HOVER EFFECT ===== */
        .hero-cta-button-custom {
          display: inline-block !important;
          position: relative !important;
          padding: 1rem 3rem !important;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1.5px !important;
          text-decoration: none !important;
          color: #000000 !important;
          background-color: #ffffff !important;
          border: 2px solid #ffffff !important;
          border-radius: 50px !important;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2) !important;
          cursor: pointer !important;
          overflow: hidden !important;
          isolation: isolate !important;
          transition: border-color 1s ease !important;
        }

        .hero-cta-button-custom::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 0% !important;
          height: 100% !important;
          background-color: #000000 !important;
          border-radius: 50px !important;
          z-index: 1 !important;
          transition: width 1s ease !important;
        }

        .hero-cta-button-custom:hover::before {
          width: 100% !important;
        }

        .hero-cta-button-custom:hover {
          border-color: #000000 !important;
        }

        .button-text-custom {
          position: relative !important;
          z-index: 2 !important;
          display: block !important;
          color: #000000 !important;
          transition: color 1s ease !important;
        }

        .hero-cta-button-custom:hover .button-text-custom {
          color: #ffffff !important;
        }

        .hero-cta-button-custom:active {
          transform: scale(0.98) !important;
        }

        /* ===== SMOOTH FADE-IN TEXT ANIMATIONS ===== */
        .hero-heading-initial-custom {
          opacity: 0 !important;
        }

        .hero-heading-animate-custom {
          animation: smoothFadeInCustom 2.5s ease-out 1.5s forwards !important;
        }

        .hero-subheading-initial-custom {
          opacity: 0 !important;
        }

        .hero-subheading-animate-custom {
          animation: smoothFadeInCustom 2.5s ease-out 2.5s forwards !important;
        }

        .hero-cta-initial-custom {
          opacity: 0 !important;
        }

        .hero-cta-animate-custom {
          animation: smoothFadeInCustom 2.5s ease-out 3.5s forwards !important;
        }

        @keyframes smoothFadeInCustom {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        /* ===== MOBILE CENTER ALIGNMENT ===== */
        @media (max-width: 768px) {
          /* ✅ Center align content layer */
          .parallax-content-layer-custom {
            text-align: center !important;
          }

          /* ✅ Center align heading */
          .hero-heading-custom {
            text-align: center !important;
          }

          /* ✅ Center align subheading */
          .hero-subheading-custom {
            text-align: center !important;
          }

          /* ✅ Center align CTA container */
          .hero-cta-custom {
            text-align: center !important;
            display: flex !important;
            justify-content: center !important;
          }

          .hero-cta-button-custom {
            padding: 0.95rem 2.5rem !important;
            font-size: 0.9rem !important;
          }

          .hero-heading-animate-custom {
            animation: smoothFadeInCustom 2s ease-out 1s forwards !important;
          }

          .hero-subheading-animate-custom {
            animation: smoothFadeInCustom 2s ease-out 1.8s forwards !important;
          }

          .hero-cta-animate-custom {
            animation: smoothFadeInCustom 2s ease-out 2.6s forwards !important;
          }

          .hero-cta-button-custom,
          .hero-cta-button-custom::before,
          .button-text-custom {
            transition-duration: 0.6s !important;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-heading-animate-custom,
          .hero-subheading-animate-custom,
          .hero-cta-animate-custom {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `,
        }}
      />
    </>
  );
}
