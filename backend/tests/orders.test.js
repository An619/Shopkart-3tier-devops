const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () =>
  (req, _res, next) => {
    req.user = { id: 1, role: 'user', email: 'user@shopkart.dev' };
    next();
  }
);

jest.mock('../src/models/orderModel', () => ({
  createWithItems: jest.fn(),
  listForUser: jest.fn(),
  findByIdForUser: jest.fn(),
  cancel: jest.fn(),
  listAll: jest.fn(),
  updateStatus: jest.fn(),
  dashboardStats: jest.fn(),
}));

jest.mock('../src/models/cartModel', () => ({
  getItems: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../src/models/productModel', () => ({
  findById: jest.fn(),
}));

jest.mock('../src/services/paymentService', () => ({
  authorize: jest.fn().mockResolvedValue({ ok: true, transactionId: 'MOCK-TEST' }),
}));

jest.mock('../src/database/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn(), on: jest.fn(), connect: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const orderModel = require('../src/models/orderModel');
const cartModel = require('../src/models/cartModel');
const productModel = require('../src/models/productModel');
const app = require('../src/app');

const validAddress = {
  fullName: 'Test User',
  line1: '1 Test Street',
  city: 'Testville',
  state: 'TS',
  postalCode: '123456',
  country: 'India',
  phone: '9999999999',
};

describe('Orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/orders rejects empty cart', async () => {
    cartModel.getItems.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/orders')
      .send({ shippingAddress: validAddress });

    expect(res.status).toBe(400);
  });

  it('POST /api/orders rejects incomplete address', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ shippingAddress: { fullName: 'X' } });

    expect(res.status).toBe(400);
  });

  it('POST /api/orders creates order successfully', async () => {
    cartModel.getItems.mockResolvedValueOnce([
      { id: 1, productId: 1, quantity: 2, price: 100, product: { name: 'Item' } },
    ]);
    productModel.findById.mockResolvedValueOnce({ id: 1, price: 100, stock: 10 });
    orderModel.createWithItems.mockResolvedValueOnce(42);
    orderModel.findByIdForUser.mockResolvedValueOnce({
      id: 42, status: 'pending', total: 249, items: [],
    });
    cartModel.clear.mockResolvedValueOnce();

    const res = await request(app)
      .post('/api/orders')
      .send({ shippingAddress: validAddress });

    expect(res.status).toBe(201);
    expect(res.body.order.id).toBe(42);
  });

  it('GET /api/orders lists user orders', async () => {
    orderModel.listForUser.mockResolvedValueOnce([
      { id: 1, status: 'pending', total: 100 },
    ]);

    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });
});
