import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import WishlistItem from '../components/WishlistItem.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Wishlist() {
  const { items, loading, remove } = useWishlist();
  const { add: addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
    navigate('/cart');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1 className="page-title">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">Your wishlist is empty.</p>
          <Link to="/products" className="btn btn-primary mt-3">Find something you love</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((it) => (
            <WishlistItem
              key={it.id}
              item={it}
              onRemove={remove}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

