import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, formatPrice, calcDiscount } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast/Toast';
import ProductCard from '../../components/ProductCard/ProductCard';
import Skeleton from '../../components/Skeleton/Skeleton';
import './Product.css';

const PRODUCT_FAQS = [
  {
    q: 'How should I care for and wash this garment?',
    a: 'We recommend machine washing cold on a gentle cycle with like colors using mild detergent. Tumble dry low or hang dry to preserve garment shape and longevity.',
  },
  {
    q: 'What is the fabric composition and material quality?',
    a: 'Crafted from 100% long-staple organic cotton and premium sustainable fibers, pre-shrunk for an enduring soft touch and true-to-size fit.',
  },
  {
    q: 'How fast is express delivery?',
    a: 'Orders are dispatched within 24 hours. Express delivery arrives within 2 to 4 business days with live SMS and AWB tracking updates.',
  },
  {
    q: 'What if the size does not fit me perfectly?',
    a: 'We offer a seamless 7-day return and instant size exchange policy. Simply initiate an exchange from your order dashboard for a free door-step pickup.',
  },
];

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const toast = useToast();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [zoomPos, setZoomPos] = useState({ show: false, x: 0, y: 0 });
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        setProductData(res);
        const p = res.product;
        if (p.images && p.images.length > 0) {
          const primary = p.images.find((img) => img.is_primary) || p.images[0];
          setSelectedImage(primary.url);
        }

        if (p.variants && p.variants.length > 0) {
          const firstSize = p.variants.find((v) => v.type === 'size');
          if (firstSize) setSelectedSize(firstSize.value);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="container page-padding">
        <Skeleton variant="page" />
      </div>
    );
  }

  if (!productData || !productData.product) {
    return (
      <div className="container page-padding text-center">
        <h2>Product Not Found</h2>
        <p className="text-secondary mt-md">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link to="/shop" className="btn btn--primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const { product, related } = productData;
  const discount = calcDiscount(product.price, product.compare_at_price);
  const isOutOfStock = product.stock <= 0;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ show: true, x, y });
  };

  const handleMouseLeave = () => {
    setZoomPos({ show: false, x: 0, y: 0 });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantLabel: selectedSize ? `Size: ${selectedSize}` : '',
      title: product.title,
      price: product.price,
      image: selectedImage || product.primary_image,
      slug: product.slug,
      quantity,
    });
    toast.success(`${product.title} added to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    openCart();
    navigate('/checkout');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on SANHI`,
          url: window.location.href,
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Product link copied to clipboard!');
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const sizeVariants = product.variants ? product.variants.filter((v) => v.type === 'size') : [];

  return (
    <div className="product-page container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        <Link to="/shop">Shop</Link>
        {product.category_name && (
          <>
            <span className="breadcrumb__sep">/</span>
            <Link to={`/shop/${product.category_slug}`}>{product.category_name}</Link>
          </>
        )}
        <span className="breadcrumb__sep">/</span>
        <span className="breadcrumb__current">{product.title}</span>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="product-main">
        {/* Left: Gallery */}
        <div className="product-gallery">
          <div
            className="product-gallery__main-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={selectedImage || product.primary_image}
              alt={product.title}
              className="product-gallery__main-img"
            />
            {zoomPos.show && (
              <div
                className="product-gallery__zoom-lens"
                style={{
                  backgroundImage: `url(${selectedImage || product.primary_image})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              />
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="product-gallery__thumbs">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  className={`product-gallery__thumb ${selectedImage === img.url ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img.url)}
                >
                  <img src={img.url} alt={img.alt_text || product.title} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details Panel */}
        <div className="product-details">
          <div className="product-details__top-row">
            {product.category_name && (
              <span className="product-details__category">{product.category_name}</span>
            )}
            <button
              className="product-share-btn"
              onClick={handleShare}
              title="Share Product"
              aria-label="Share product link"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>
          </div>

          <h1 className="product-details__title">{product.title}</h1>

          {/* Rating */}
          {product.avg_rating && (
            <div className="product-details__rating">
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    viewBox="0 0 24 24"
                    fill={star <= Math.round(product.avg_rating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="product-details__rating-text">
                {product.avg_rating} ({product.review_count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="product-details__price-row">
            <span className="price__current">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="price__compare">{formatPrice(product.compare_at_price)}</span>
                <span className="badge badge--sale">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="product-details__sku">SKU: {product.sku || 'N/A'}</p>

          <div className="divider" />

          {/* Size Selector */}
          {sizeVariants.length > 0 && (
            <div className="product-option">
              <div className="product-option__header">
                <span className="product-option__label">Select Size:</span>
                <span className="product-option__selected">{selectedSize}</span>
              </div>
              <div className="product-option__chips">
                {sizeVariants.map((v) => (
                  <button
                    key={v.id}
                    className={`filter-chip ${selectedSize === v.value ? 'filter-chip--active' : ''}`}
                    onClick={() => {
                      setSelectedSize(v.value);
                      setSelectedVariant(v);
                    }}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="product-option">
            <span className="product-option__label">Quantity:</span>
            <div className="quantity-stepper">
              <button
                className="quantity-stepper__btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="quantity-stepper__val">{quantity}</span>
              <button
                className="quantity-stepper__btn"
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <button
              className="btn btn--primary btn--lg btn--full"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
            {!isOutOfStock && (
              <button className="btn btn--outline btn--lg btn--full" onClick={handleBuyNow}>
                Buy Now
              </button>
            )}
          </div>

          {/* Horizontal Row: Big Icon Top, Title Bottom (No Overlay) */}
          <div className="product-trust-row-big">
            <div className="product-trust-col">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Express Delivery</span>
            </div>

            <div className="product-trust-col">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>Organic Quality</span>
            </div>

            <div className="product-trust-col">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span>24/7 Support</span>
            </div>

            <div className="product-trust-col">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
              <span>7-Day Returns</span>
            </div>
          </div>

          <div className="divider" />

          {/* Description Only (No Tabs) */}
          {product.description && (
            <div className="product-description-wrap">
              <p className="product-description-text">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 1. Related Products ("You May Also Like" FIRST) */}
      {related && related.length > 0 && (
        <section className="section related-products">
          <div className="section__header">
            <h2 className="section__title">You May Also Like</h2>
            <p className="section__subtitle">Explore similar items from this collection</p>
          </div>
          <div className="product-grid">
            {related.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Product FAQ Section (THEN FAQ) */}
      <section className="section product-faq-section">
        <div className="product-faq-container">
          <h2 className="product-faq-title">Product FAQ</h2>
          <div className="product-faq-list">
            {PRODUCT_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className={`product-faq-item ${activeFaq === idx ? 'product-faq-item--active' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="product-faq-question">
                  <h3>{faq.q}</h3>
                  <span className="product-faq-toggle">{activeFaq === idx ? '−' : '+'}</span>
                </div>
                {activeFaq === idx && (
                  <div className="product-faq-answer animate-fade-down">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
