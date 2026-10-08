import { useEffect, useState } from 'react';
import adminService from '../../services/adminService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const emptyForm = {
  name: '', description: '', price: '', discount: 0,
  stock: 0, imageUrl: '', categoryId: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([
        adminService.listProducts({ limit: 100 }),
        adminService.listCategories().catch(() => ({ categories: [] })),
      ]);
      setProducts(p.products || p.items || []);
      setCategories(c.categories || c || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
      discount: p.discount || 0,
      stock: p.stock || 0,
      imageUrl: p.imageUrl || '',
      categoryId: p.categoryId || '',
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount),
        stock: Number(form.stock),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      };
      if (editing) await adminService.updateProduct(editing.id, payload);
      else await adminService.createProduct(payload);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await adminService.deleteProduct(p.id);
      await load();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1 className="page-title" style={{ margin: 0 }}>Manage Products</h1>
        <button type="button" className="btn btn-primary" onClick={startCreate}>+ Add Product</button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="card mb-3">
          <h2>{editing ? `Edit: ${editing.name}` : 'New Product'}</h2>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows="3" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" min="0" step="0.01" className="form-control" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input type="number" min="0" max="90" className="form-control" value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" min="0" className="form-control" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input className="form-control" value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.categoryName || '—'}</td>
              <td>₹{Number(p.price || 0).toLocaleString()}</td>
              <td>{p.stock ?? '—'}</td>
              <td>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>Edit</button>{' '}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .card h2 { font-size: 16px; margin: 0 0 16px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 768px) { .grid-3, .grid-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
