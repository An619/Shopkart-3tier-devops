import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products = [] }) {
  if (!products.length) {
    return <div className="text-center text-muted mt-4">No products found.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
