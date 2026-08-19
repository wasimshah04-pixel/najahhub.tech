import { useState, useEffect } from 'react';
import './ReviewCarousel.css';

export default function ReviewCarousel({ reviews = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  if (!reviews || reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="review-carousel">
      <div className="review-carousel__card" key={currentReview.id || currentIndex}>
        <div className="stars review-carousel__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              viewBox="0 0 24 24"
              fill={star <= currentReview.rating ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <blockquote className="review-carousel__comment">
          "{currentReview.comment}"
        </blockquote>
        <div className="review-carousel__meta">
          <span className="review-carousel__author">{currentReview.user_name}</span>
          {currentReview.product_title && (
            <span className="review-carousel__product">Verified Purchase · {currentReview.product_title}</span>
          )}
        </div>
      </div>

      {reviews.length > 1 && (
        <div className="review-carousel__controls">
          <button className="review-carousel__btn" onClick={prevReview} aria-label="Previous review">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="review-carousel__dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={`review-carousel__dot ${i === currentIndex ? 'review-carousel__dot--active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          <button className="review-carousel__btn" onClick={nextReview} aria-label="Next review">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
