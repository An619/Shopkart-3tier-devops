const request = require('supertest');

jest.mock('../src/models/productModel', () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  decrementStock: jest.fn(),
  count: jest.fn(),
}));

jest.mock('../src/models/reviewModel', () => ({
  listForProduct: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  remove: jest.fn(),
  statsForProduct: jest.fn().mockResolvedValue({ avgRating: '4.5', reviewCount: 2 }),
}));

jest.mock('../src/database/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn(), on: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const productModel = require('../src/models/productModel');
const app = require('../src/app');

describe('Products', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/products returns a list', async () => {
    productModel.list.mockResolvedValueOnce({
      products: [
        { id: 1, name: 'Sample Phone', price: 19999 },
        { id: 2, name: 'Sample Laptop', price: 54999 },
      ],
      total: 2,
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('GET /api/products/:id returns 404 when missing', async () => {
    productModel.findById.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/products/999');
    expect(res.status).toBe(404);
  });

  it('GET /api/products/:id returns the product when found', async () => {
    productModel.findById.mockResolvedValueOnce({
      id: 1, name: 'Sample Phone', price: 19999, stock: 5,
    });

    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Sample Phone');
    expect(res.body.avgRating).toBe(4.5);
  });
});
