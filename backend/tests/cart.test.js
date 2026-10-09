const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () =>
  (req, _res, next) => {
    req.user = { id: 1, role: 'user', email: 'user@shopkart.dev' };
    next();
  }
);

jest.mock('../src/models/cartModel', () => ({
  getOrCreateCart: jest.fn(),
  getItems: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../src/models/productModel', () => ({
  findById: jest.fn(),
}));

jest.mock('../src/database/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn(), on: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const cartModel = require('../src/models/cartModel');
const productModel = require('../src/models/productModel');
const app = require('../src/app');

describe('Cart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/cart returns items', async () => {
    cartModel.getItems.mockResolvedValueOnce([
      { id: 10, productId: 1, quantity: 2, price: 100 },
    ]);

    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('POST /api/cart rejects invalid productId', async () => {
    const res = await request(app).post('/api/cart').send({ productId: 'abc' });
    expect(res.status).toBe(400);
  });

  it('POST /api/cart returns 404 for unknown product', async () => {
    productModel.findById.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/cart').send({ productId: 999, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it('POST /api/cart adds item when product exists', async () => {
    productModel.findById.mockResolvedValueOnce({ id: 1, price: 100, stock: 10 });
    cartModel.addItem.mockResolvedValueOnce([
      { id: 10, productId: 1, quantity: 1, price: 100 },
    ]);

    const res = await request(app).post('/api/cart').send({ productId: 1, quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
  });
});
