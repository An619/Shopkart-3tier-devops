/**
 * SIMULATED payment service.
 * This project does NOT integrate a real payment gateway.
 * authorize() always returns ok: true for demo purposes.
 */
async function authorize({ amount, method = 'MOCK' }) {
  if (!amount || amount <= 0) return { ok: false, reason: 'Invalid amount' };
  if (method !== 'MOCK') return { ok: false, reason: 'Only MOCK supported' };
  return { ok: true, provider: 'MOCK', transactionId: `MOCK-${Date.now()}` };
}

module.exports = { authorize };
