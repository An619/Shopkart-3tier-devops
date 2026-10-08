import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';

// Axios is called by the contexts on mount; mock the services.
vi.mock('../services/cartService.js', () => ({
  default: { get: vi.fn().mockResolvedValue({ items: [] }) },
}));
vi.mock('../services/wishlistService.js', () => ({
  default: { get: vi.fn().mockResolvedValue({ items: [] }) },
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Navbar />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('renders the ShopKart brand', () => {
    renderNavbar();
    expect(screen.getByText(/shop/i)).toBeInTheDocument();
  });

  it('shows Login when not authenticated', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('shows the search bar', () => {
    renderNavbar();
    expect(
      screen.getByPlaceholderText(/search for products/i)
    ).toBeInTheDocument();
  });
});
