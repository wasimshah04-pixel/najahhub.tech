import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/api';
import './CartDrawer.css';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={closeCart}>
      <aside
        ref={drawerRef}
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        {/* Header */}
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            Cart
            {itemCount > 0 && <span className="cart-drawer__count">({itemCount})</span>}
          </h2>
          <button
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Close cart"
            id="cart-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Cart Body */}
        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <p className="cart-drawer__empty-text">Your cart is empty</p>
            <button className="btn btn--primary" onClick={() => { closeCart(); navigate('/shop'); }}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="cart-drawer__items">
              {items.map((item, index) => (
                <div key={`${item.productId}-${item.variantId}-${index}`} className="cart-item">
                  <Link
                    to={`/product/${item.slug}`}
                    className="cart-item__image-link"
                    onClick={closeCart}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="cart-item__img"
                      loading="lazy"
                    />
                  </Link>
                  <div className="cart-item__details">
                    <Link
                      to={`/product/${item.slug}`}
                      className="cart-item__title"
                      onClick={closeCart}
                    >
                      {item.title}
                    </Link>
                    {item.variantLabel && (
                      <span className="cart-item__variant">{item.variantLabel}</span>
                    )}
                    <span className="cart-item__price">{formatPrice(item.price)}</span>

                    <div className="cart-item__actions">
                      {/* Quantity */}
                      <div className="cart-item__qty">
                        <button
                          className="cart-item__qty-btn"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="cart-item__qty-value">{item.quantity}</span>
                        <button
                          className="cart-item__qty-btn"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(index)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <span className="cart-item__total">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <span className="cart-drawer__subtotal-value">{formatPrice(subtotal)}</span>
              </div>
              <p className="cart-drawer__shipping-note">Shipping calculated at checkout</p>
              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleCheckout}
                id="cart-checkout-btn"
              >
                Checkout — {formatPrice(subtotal)}
              </button>
              <button
                className="btn btn--ghost btn--full"
                onClick={() => { closeCart(); navigate('/shop'); }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
