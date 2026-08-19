import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useReveal } from '../../hooks/useHooks';
import ProductCard from '../../components/ProductCard/ProductCard';
import Skeleton from '../../components/Skeleton/Skeleton';
import ReviewCarousel from '../../components/ReviewCarousel/ReviewCarousel';
import Newsletter from '../../components/Newsletter/Newsletter';
import heroVideo from '../../Assets/3a467868e4034f27a828d1c63846ad65.webm';
import './Home.css';

function ScrollSection({ children, className = '', ...props }) {
  const [ref, isRevealed] = useReveal({ threshold: 0.08 });
  return (
    <section
      ref={ref}
      className={`reveal ${isRevealed ? 'revealed' : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

const FAQS = [
  {
    q: 'How long does delivery take for my order?',
    a: 'All standard orders are processed and dispatched within 24 hours. Express delivery takes 2 to 4 business days nationwide with live courier tracking.',
  },
  {
    q: 'What is your return & exchange policy?',
    a: 'We offer a 7-day hassle-free return and exchange policy from the date of delivery. Items must be unworn, unwashed, and in original packaging with tags intact.',
  },
  {
    q: 'How can I track my order status?',
    a: 'Once your order is shipped, you will receive an automated SMS and email notification containing your courier tracking AWB link. You can also view status timelines in your Account dashboard.',
  },
  {
    q: 'What payment options are available?',
    a: 'We support Cash on Delivery (COD), instant UPI payments (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), and Net Banking.',
  },
  {
    q: 'How do I choose the correct size for me?',
    a: 'Each product page includes a comprehensive Size Chart with exact chest, shoulder, and length measurements in inches to ensure a perfect fit.',
  },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [featRes, newRes, bestRes, catRes, revRes] = await Promise.all([
          api.get('/products/featured?limit=4'),
          api.get('/products/new-arrivals?limit=4'),
          api.get('/products/best-sellers?limit=4'),
          api.get('/categories'),
          api.get('/settings/reviews?limit=6'),
        ]);

        setFeaturedProducts(featRes.products || []);
        setNewArrivals(newRes.products || []);
        setBestSellers(bestRes.products || []);
        setCategories(catRes.categories || []);
        setReviews(revRes.reviews || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="home-page">
      {/* 1. Full Screen Video Hero Banner */}
      <section className="hero-banner hero-banner--fullscreen">
        <div className="hero-banner__bg">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="hero-banner__video"
          >
            <source src={heroVideo} type="video/webm" />
          </video>
          <div className="hero-banner__overlay" />
        </div>

        <div className="hero-banner__bottom-wrap container">
          <div className="hero-banner__meta animate-fade-up">
            <span className="hero-banner__tagline">SANHI — SUMMER 2026</span>
            <h1 className="hero-banner__title">Redefining Minimal Elegance</h1>
          </div>

          <div className="hero-banner__cta animate-fade-up stagger-1">
            <Link to="/shop" className="btn btn--hero-sm btn--hero-primary">
              Explore Collection
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/shop?sort=newest" className="btn btn--hero-sm btn--hero-secondary">
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Collection */}
      <ScrollSection className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Featured Collection</h2>
            <p className="section__subtitle">Handpicked pieces defining this season's signature look</p>
          </div>
          {loading ? (
            <Skeleton variant="product-grid" count={4} />
          ) : (
            <div className="product-grid">
              {featuredProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
        </div>
      </ScrollSection>

      {/* 3. New Arrivals */}
      <ScrollSection className="section section--alt">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">New Arrivals</h2>
            <p className="section__subtitle">Fresh styles added to our catalog this week</p>
          </div>
          {loading ? (
            <Skeleton variant="product-grid" count={4} />
          ) : (
            <div className="product-grid">
              {newArrivals.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
          <div className="home-section__footer">
            <Link to="/shop?sort=newest" className="btn btn--outline">
              View All New Arrivals
            </Link>
          </div>
        </div>
      </ScrollSection>

      {/* 4. Best Sellers */}
      <ScrollSection className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Best Sellers</h2>
            <p className="section__subtitle">Our most coveted and highly-rated wardrobe staples</p>
          </div>
          {loading ? (
            <Skeleton variant="product-grid" count={4} />
          ) : (
            <div className="product-grid">
              {bestSellers.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          )}
        </div>
      </ScrollSection>

      {/* 5. Pentagraph Category Frame Showcase */}
      <ScrollSection className="section pentagraph-section">
        <div className="container">
          <div className="section__header">
            <span className="section__tagline">GEOMETRIC CURATION</span>
            <h2 className="section__title">The Pentagraph Categories</h2>
            <p className="section__subtitle">Five core pillars of modern minimalism designed for every mood</p>
          </div>

          <div className="pentagraph-grid">
            <Link to="/shop/shirts" className="penta-card penta-card--1">
              <div className="penta-frame">
                <img
                  src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop"
                  alt="Shirts & Linen"
                  className="penta-img"
                />
                <div className="penta-overlay" />
                <span className="penta-num">01</span>
              </div>
              <div className="penta-info">
                <h3>Shirts & Linen</h3>
                <span className="penta-link">Explore →</span>
              </div>
            </Link>

            <Link to="/shop/t-shirts" className="penta-card penta-card--2">
              <div className="penta-frame">
                <img
                  src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=1000&fit=crop"
                  alt="Essential T-Shirts"
                  className="penta-img"
                />
                <div className="penta-overlay" />
                <span className="penta-num">02</span>
              </div>
              <div className="penta-info">
                <h3>Essential Tees</h3>
                <span className="penta-link">Explore →</span>
              </div>
            </Link>

            <Link to="/shop/jackets" className="penta-card penta-card--center">
              <div className="penta-frame penta-frame--lg">
                <img
                  src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop"
                  alt="Outerwear & Jackets"
                  className="penta-img"
                />
                <div className="penta-overlay" />
                <span className="penta-num">03</span>
                <span className="penta-badge">SIGNATURE</span>
              </div>
              <div className="penta-info">
                <h3>Outerwear & Jackets</h3>
                <span className="penta-link">Explore Collection →</span>
              </div>
            </Link>

            <Link to="/shop/jeans" className="penta-card penta-card--4">
              <div className="penta-frame">
                <img
                  src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop"
                  alt="Denim & Trousers"
                  className="penta-img"
                />
                <div className="penta-overlay" />
                <span className="penta-num">04</span>
              </div>
              <div className="penta-info">
                <h3>Denim & Trousers</h3>
                <span className="penta-link">Explore →</span>
              </div>
            </Link>

            <Link to="/shop/accessories" className="penta-card penta-card--5">
              <div className="penta-frame">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop"
                  alt="Accessories & Leather"
                  className="penta-img"
                />
                <div className="penta-overlay" />
                <span className="penta-num">05</span>
              </div>
              <div className="penta-info">
                <h3>Accessories</h3>
                <span className="penta-link">Explore →</span>
              </div>
            </Link>
          </div>
        </div>
      </ScrollSection>

      {/* 6. Promotional Banner */}
      <ScrollSection className="promo-banner">
        <div className="container">
          <div className="promo-banner__content">
            <span className="promo-banner__tag">Limited Offer</span>
            <h2 className="promo-banner__title">Get 10% Off Your First Order</h2>
            <p className="promo-banner__desc">Use code <strong>WELCOME10</strong> at checkout on orders over ₹999.</p>
            <Link to="/shop" className="btn btn--primary">
              Shop Now
            </Link>
          </div>
        </div>
      </ScrollSection>

      {/* 7. Customer Reviews */}
      <ScrollSection className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">What Our Customers Say</h2>
            <p className="section__subtitle">Real feedback from verified shoppers</p>
          </div>
          <ReviewCarousel reviews={reviews} />
        </div>
      </ScrollSection>

      {/* 8. Trust Badges & Value Propositions (Before Footer) */}
      <ScrollSection className="section trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3>Faster Express Delivery</h3>
              <p>Dispatched within 24 hours. Delivered in 2–4 business days with live tracking.</p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3>Quality Product Guarantee</h3>
              <p>Crafted from 100% organic cotton and sustainable luxury fabrics built to last.</p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <h3>24/7 Customer Support</h3>
              <p>Round-the-clock assistance via live chat and email for all your queries.</p>
            </div>

            <div className="trust-card">
              <div className="trust-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
              </div>
              <h3>7-Day Easy Returns</h3>
              <p>Hassle-free 7-day return and instant size exchange policy.</p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* 9. Minimalist FAQ Accordion Section */}
      <ScrollSection className="section faq-section">
        <div className="container container--narrow">
          <div className="section__header section__header--minimal">
            <h2 className="section__title">Everything You Need to Know</h2>
          </div>

          <div className="faq-list faq-list--minimal">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${activeFaq === idx ? 'faq-item--active' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <span className="faq-toggle-icon">{activeFaq === idx ? '−' : '+'}</span>
                </div>
                {activeFaq === idx && (
                  <div className="faq-answer animate-fade-down">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* 10. Newsletter */}
      <ScrollSection className="section section--alt">
        <div className="container">
          <Newsletter variant="section" />
        </div>
      </ScrollSection>
    </div>
  );
}
