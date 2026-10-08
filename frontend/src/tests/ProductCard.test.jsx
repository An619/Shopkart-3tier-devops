import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';

vi.mock('../services/cartService.js', () => ({
  default: { get: vi.fn().mockResolvedValue({ items: [] }) },
}));
vi.mock('../services/wishlistService.js', () => ({
  default: { get: vi.fn().mockResolvedValue({ items: [] }) },
}));

const sampleProduct = {
  id: 1,
  name: 'Sample Phone',
  price: 19999,
  discount: 10,
  stock: 5,
  avgRating: 4.2,
  reviewCount: 12,
  categoryName: 'Mobiles',
};

function renderCard(product = sampleProduct) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ProductCard product={product} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders the product name', () => {
    renderCard();
    expect(screen.getByText('Sample Phone')).toBeInTheDocument();
  });

  it('shows the formatted price', () => {
    renderCard();
    expect(screen.getByText(/19,999/)).toBeInTheDocument();
  });

  it('shows the discount badge', () => {
    renderCard();
    expect(screen.getByText('-10%')).toBeInTheDocument();
  });

  it('shows "Out of stock" when stock is 0', () => {
    renderCard({ ...sampleProduct, stock: 0 });
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });
});
