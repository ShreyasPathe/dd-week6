import {useState, useCallback, useMemo} from 'react';
import {Image} from '@shopify/hydrogen';
import type {Metaobject} from '@shopify/hydrogen/storefront-api-types';
import PixelSnow from './PixelSnow';

interface Review {
  id: string;
  customerName: string;
  customerRole: string;
  customerImage: string;
  rating: number;
  reviewText: string;
}

interface ReviewsSectionProps {
  metaobject?: Metaobject | null;
}

export function ReviewsSection({metaobject}: ReviewsSectionProps) {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  // ===== ERROR HANDLING =====
  if (!metaobject?.fields) {
    console.error('[ReviewsSection] metaobject is null or has no fields');
    return null;
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

  // ===== EXTRACT DATA (Memoized) =====
  const heading = useMemo(
    () => getFieldValue('heading') || 'What Our Customers Say',
    [getFieldValue],
  );

  const reviewNodes = useMemo(() => getFieldReferences('reviews'), [getFieldReferences]);

  // ===== PROCESS REVIEWS (Memoized) =====
  const reviews: Review[] = useMemo(() => {
    return reviewNodes
      .filter((node: any) => node && node.fields)
      .map((review: any) => {
        const getReviewField = (key: string) => {
          const field = review.fields?.find((f: any) => f?.key === key);
          return field?.value || '';
        };

        const getReviewImageField = (key: string) => {
          const field = review.fields?.find((f: any) => f?.key === key);
          if (field?.reference && field.reference.image) {
            return field.reference.image.url;
          }
          return '';
        };

        const customerName = getReviewField('customer_name');
        const customerRole = getReviewField('customer_role');
        const customerImage = getReviewImageField('customer_img');
        const rating = parseFloat(getReviewField('rating') || '5');
        const reviewText = getReviewField('review_text');

        return {
          id: review.id,
          customerName,
          customerRole,
          customerImage:
            customerImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=667eea&color=fff&size=100&bold=true`,
          rating,
          reviewText,
        };
      });
  }, [reviewNodes]);

  // ===== ERROR HANDLING: No Reviews =====
  if (reviews.length === 0) {
    return null;
  }

  // ===== SPLIT REVIEWS INTO COLUMNS (Memoized) =====
  const [col1, col2, col3] = useMemo(() => {
    const column1: Review[] = [];
    const column2: Review[] = [];
    const column3: Review[] = [];

    reviews.forEach((review, index) => {
      if (index % 3 === 0) column1.push(review);
      else if (index % 3 === 1) column2.push(review);
      else column3.push(review);
    });

    // Triple duplicate for smoother infinite scroll
    return [
      [...column1, ...column1, ...column1],
      [...column2, ...column2, ...column2],
      [...column3, ...column3, ...column3],
    ];
  }, [reviews]);

  // ===== RENDER STARS (Memoized) =====
  const renderStars = useCallback((rating: number) => {
    return Array.from({length: 5}, (_, i) => (
      <span key={i} className={`star ${i < Math.floor(rating) ? 'filled' : ''}`}>
        ★
      </span>
    ));
  }, []);

  // ===== RENDER REVIEW CARD (Memoized) =====
  const renderReviewCard = useCallback(
    (review: Review, index: number) => (
      <div key={`${review.id}-${index}`} className="review-card">
        <div className="review-header">
          <img
            src={review.customerImage}
            alt={review.customerName}
            className="customer-avatar"
            loading="lazy"
            width={50}
            height={50}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customerName)}&background=667eea&color=fff&size=100&bold=true`;
            }}
          />
          <div className="customer-info">
            <h3 className="customer-name">{review.customerName}</h3>
            <p className="customer-role">{review.customerRole}</p>
          </div>
        </div>

        <div className="review-rating">{renderStars(review.rating)}</div>

        <p className="review-text">{review.reviewText}</p>
      </div>
    ),
    [renderStars],
  );

  // ===== HOVER HANDLERS (Memoized) =====
  const handleColumnEnter = useCallback((columnIndex: number) => {
    setHoveredColumn(columnIndex);
  }, []);

  const handleColumnLeave = useCallback(() => {
    setHoveredColumn(null);
  }, []);

  return (
    <>
      <section className="reviews-section">
        {/* PixelSnow Background */}
        <div className="pixel-snow-background">
          <PixelSnow
            color="#ffffff"
            flakeSize={0.01}
            minFlakeSize={1.25}
            pixelResolution={200}
            speed={1.25}
            density={0.3}
            direction={125}
            brightness={1}
          />
        </div>

        <div className="reviews-container">
          <h2 className="reviews-heading">{heading}</h2>

          <div className="reviews-columns">
            {/* Column 1 */}
            <div
              className="review-column"
              onMouseEnter={() => handleColumnEnter(0)}
              onMouseLeave={handleColumnLeave}
            >
              <div
                className={`review-column-inner column-inner-1 ${hoveredColumn === 0 ? 'paused' : ''}`}
              >
                {col1.map((review, index) => renderReviewCard(review, index))}
              </div>
            </div>

            {/* Column 2 */}
            <div
              className="review-column"
              onMouseEnter={() => handleColumnEnter(1)}
              onMouseLeave={handleColumnLeave}
            >
              <div
                className={`review-column-inner column-inner-2 ${hoveredColumn === 1 ? 'paused' : ''}`}
              >
                {col2.map((review, index) => renderReviewCard(review, index))}
              </div>
            </div>

            {/* Column 3 */}
            <div
              className="review-column"
              onMouseEnter={() => handleColumnEnter(2)}
              onMouseLeave={handleColumnLeave}
            >
              <div
                className={`review-column-inner column-inner-3 ${hoveredColumn === 2 ? 'paused' : ''}`}
              >
                {col3.map((review, index) => renderReviewCard(review, index))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ===== REVIEWS SECTION ===== */
        .reviews-section {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: #0a0a0a;
          padding: 4rem 2rem;
          overflow: hidden;
        }

        /* PixelSnow Background */
        .pixel-snow-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          opacity: 0.8;
        }

        .reviews-container {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Heading */
        .reviews-heading {
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          color: #ffffff;
          margin-bottom: 2.5rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /* 3 Column Grid */
        .reviews-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          height: 650px;
          overflow: hidden;
          mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        /* Individual Column */
        .review-column {
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }

        /* Column Inner with Animation */
        .review-column-inner {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          will-change: transform;
        }

        /* Column 1 Animation */
        .column-inner-1 {
          animation: scrollVertical1 35s linear infinite;
        }

        /* Column 2 Animation */
        .column-inner-2 {
          animation: scrollVertical2 38s linear infinite;
        }

        /* Column 3 Animation */
        .column-inner-3 {
          animation: scrollVertical3 41s linear infinite;
        }

        /* Pause on Hover */
        .review-column-inner.paused {
          animation-play-state: paused;
        }

        /* Keyframe Animations */
        @keyframes scrollVertical1 {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-33.33%);
          }
        }

        @keyframes scrollVertical2 {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-33.33%);
          }
        }

        @keyframes scrollVertical3 {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-33.33%);
          }
        }

        /* Review Card */
        .review-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          min-height: 250px;
          flex-shrink: 0;
        }

        .review-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        /* Review Header */
        .review-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .customer-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }

        .customer-info {
          flex: 1;
        }

        .customer-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
        }

        .customer-role {
          font-size: 0.85rem;
          color: #999;
          margin: 0;
        }

        /* Rating */
        .review-rating {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .star {
          color: #333;
          transition: color 0.2s ease;
        }

        .star.filled {
          color: #FFD700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        /* Review Text */
        .review-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #ccc;
          margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 968px) {
          .reviews-section {
            padding: 3rem 1rem;
          }

          .reviews-heading {
            font-size: 1.5rem;
            margin-bottom: 2rem;
          }

          .reviews-columns {
            grid-template-columns: 1fr;
            height: 500px;
            gap: 0;
          }

          .review-column:nth-child(2),
          .review-column:nth-child(3) {
            display: none;
          }

          .review-card {
            min-height: 200px;
            padding: 1.25rem;
          }

          .customer-name {
            font-size: 1rem;
          }

          .review-text {
            font-size: 0.9rem;
          }
        }

        /* Tablet */
        @media (min-width: 769px) and (max-width: 1024px) {
          .reviews-heading {
            font-size: 1.6rem;
          }

          .reviews-columns {
            gap: 1.5rem;
            height: 600px;
          }

          .review-card {
            padding: 1.25rem;
          }
        }
      `,
        }}
      />
    </>
  );
}
