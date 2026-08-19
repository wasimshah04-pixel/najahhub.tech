import { Link } from 'react-router-dom';
import './MegaMenu.css';

export default function MegaMenu({ categories = [], isOpen, onClose, onMouseEnter, onMouseLeave }) {
  if (!isOpen) return null;

  return (
    <div className="mega-menu" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="mega-menu__inner container">
        <div className="mega-menu__col">
          <h4 className="mega-menu__title">Categories</h4>
          <ul className="mega-menu__list">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link to={`/shop/${cat.slug}`} onClick={onClose} className="mega-menu__link link-underline">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mega-menu__col">
          <h4 className="mega-menu__title">Collections</h4>
          <ul className="mega-menu__list">
            <li><Link to="/shop?collection=summer-2026" onClick={onClose} className="mega-menu__link link-underline">Summer 2026</Link></li>
            <li><Link to="/shop?collection=winter-essentials" onClick={onClose} className="mega-menu__link link-underline">Winter Essentials</Link></li>
            <li><Link to="/shop?collection=everyday-basics" onClick={onClose} className="mega-menu__link link-underline">Everyday Basics</Link></li>
          </ul>
        </div>

        <div className="mega-menu__col mega-menu__featured">
          <div className="mega-menu__card">
            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop"
              alt="Featured"
              className="mega-menu__card-img"
            />
            <div className="mega-menu__card-info">
              <span className="badge badge--new">New Arrival</span>
              <h5 className="mega-menu__card-title">Organic Cotton Tees</h5>
              <Link to="/shop/t-shirts" onClick={onClose} className="btn btn--ghost btn--sm">Shop Tees →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
