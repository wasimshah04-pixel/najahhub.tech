import './Skeleton.css';

export default function Skeleton({ variant = 'rect', width, height, count = 1, className = '' }) {
  if (variant === 'product-card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton skeleton--image" />
        <div className="skeleton-card__body">
          <div className="skeleton skeleton--text" style={{ width: '60%' }} />
          <div className="skeleton skeleton--text" style={{ width: '80%' }} />
          <div className="skeleton skeleton--text" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  if (variant === 'product-grid') {
    return (
      <div className="product-grid">
        {Array.from({ length: count || 8 }).map((_, i) => (
          <Skeleton key={i} variant="product-card" />
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="skeleton-page">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton-page__content">
          <div className="skeleton skeleton--text" style={{ width: '50%', height: '24px' }} />
          <div className="skeleton skeleton--text" style={{ width: '100%' }} />
          <div className="skeleton skeleton--text" style={{ width: '90%' }} />
          <div className="skeleton skeleton--text" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span
        className={`skeleton skeleton--text ${className}`}
        style={{ width: width || '100%', height: height || '16px' }}
      />
    );
  }

  if (variant === 'circle') {
    return (
      <span
        className={`skeleton skeleton--circle ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  return (
    <span
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height: height || '20px' }}
    />
  );
}
