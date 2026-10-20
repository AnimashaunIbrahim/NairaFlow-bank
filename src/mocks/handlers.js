/**
 * MSW Handlers — mock API endpoints for the NairaFlow fintech dashboard.
 * These intercept fetch() at the network level.
 */
import { http, HttpResponse, delay } from 'msw';
import { generateTransactions, SAVINGS_PLANS, EXCHANGE_RATES, generateCustomers } from './data';

// Bank code to name mapping (matches the grouped list in SendMoneyForm.jsx)
const BANK_NAMES = {
  // Commercial Banks
  '101': 'GTBank',
  '044': 'Access Bank',
  '401': 'Zenith Bank',
  '501': 'UBA',
  '012': 'Fidelity Bank',
  '103': 'Kuda Bank',
  '050': 'Ecobank',
  '011': 'First Bank of Nigeria',
  '032': 'Union Bank of Nigeria',
  '076': 'Polaris Bank',
  '082': 'Keystone Bank',
  '035': 'Wema Bank',
  '232': 'Sterling Bank',
  '221': 'Stanbic IBTC Bank',
  '215': 'Unity Bank',
  '301': 'Jaiz Bank',
  // Digital Banks
  '201': 'OPay',
  '100': 'Providus Bank',
  '313': 'Titan Trust Bank',
  '503': 'VFD Microfinance Bank',
};

function getBankName(code) {
  return BANK_NAMES[code] || `${code}`;
}

// Generate a stable set of transactions (refreshed per session)
let cachedTransactions = generateTransactions(15);

// In-memory customer store for CRUD operations (refreshed per session)
let cachedCustomers = generateCustomers(12);

// Track dynamic balance (in kobo - starts at 2,450,000 NGN = 245,000,000 kobo)
let currentBalance = 245000000;

export const handlers = [
  // ─── GET /api/balance ───
  http.get('/api/balance', async () => {
    await delay(600);
    if (Math.random() < 0.05) return new HttpResponse(null, { status: 500 });
    return HttpResponse.json({
      amount: currentBalance,
      currency: 'NGN',
      trend: 12,
    });
  }),

  // ─── GET /api/transactions ───
  http.get('/api/transactions', async () => {
    await delay(800);
    if (Math.random() < 0.08) return new HttpResponse(null, { status: 500 });
    return HttpResponse.json({ transactions: cachedTransactions });
  }),

  // ─── POST /api/transfers ───
  http.post('/api/transfers', async ({ request }) => {
    await delay(1500);
    if (Math.random() < 0.1) {
      return HttpResponse.json(
        { error: 'Transfer failed. Please try again.' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const amountInKobo = Number(body.amount) * 100;
    const transferFee = 15000; // 150 NGN fee in kobo
    const currency = body.currency || 'NGN';

    // Calculate total deduction from balance
    let totalDeduction = amountInKobo + transferFee;

    // For international transfers, convert to NGN equivalent (future enhancement)
    if (currency !== 'NGN') {
      // Import EXCHANGE_RATES for conversion
      // For now, we'll handle international transfers similarly but note this is for future
      // TODO: Implement proper currency conversion using EXCHANGE_RATES
    }

    // Deduct from balance (only if sufficient funds)
    if (currentBalance >= totalDeduction) {
      currentBalance -= totalDeduction;
    } else {
      return HttpResponse.json(
        { error: 'Insufficient funds for this transfer.' },
        { status:  400 }
      );
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      description: body.narration || `Transfer to ${body.accountNumber}`,
      amount: amountInKobo,
      currency: currency,
      status: 'success',
      bank: getBankName(body.bankCode) || 'GTBank', // Store bank name instead of code
      account: body.accountNumber,
      date: new Date().toISOString(),
      fee: transferFee,
    };
    cachedTransactions = [newTx, ...cachedTransactions];
    return HttpResponse.json({
      success: true,
      reference: `NF-${Date.now()}`,
      amount: newTx.amount,
      recipient: body.accountNumber,
      newBalance: currentBalance, // Include updated balance in response
    });
  }),

  // ─── GET /api/savings ───
  http.get('/api/savings', async () => {
    await delay(600);
    return HttpResponse.json({ plans: SAVINGS_PLANS });
  }),

  // ─── GET /api/rates ───
  http.get('/api/rates', async () => {
    await delay(400);
    return HttpResponse.json({
      rates: EXCHANGE_RATES,
      lastUpdated: new Date().toISOString(),
    });
  }),

  // ─── GET /api/insights ───
  http.get('/api/insights', async () => {
    await delay(700);
    return HttpResponse.json({
      insights: [
        { id: 1, icon: '📊', headline: 'Spending up 12%', detail: 'Your spending is up 12% this month, mostly on data subscriptions.', confidence: 0.87 },
        { id: 2, icon: '🎯', headline: 'Savings on track', detail: 'Your Fixed Deposit is on track to hit ₦5,000,000 by December.', confidence: 0.92 },
        { id: 3, icon: '💡', headline: 'Airtime tip', detail: 'You spent ₦45,000 on airtime this month — 20% above average.', confidence: 0.78 },
      ],
    });
  }),

  // ─── GET /api/customers ───
  http.get('/api/customers', async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = Math.max(1, parseInt(url.searchParams.get('perPage') || '10', 10));
    const start = (page - 1) * perPage;
    const customers = cachedCustomers.slice(start, start + perPage);

    return HttpResponse.json({
      customers,
      pagination: {
        perPage,
        page,
        next: start + perPage < cachedCustomers.length ? String(page + 1) : null,
        previous: page > 1 ? String(page - 1) : null,
      },
    });
  }),

  // ─── GET /api/customers/:emailOrCode ───
  http.get('/api/customers/:emailOrCode', async ({ params }) => {
    await delay(500);
    const key = decodeURIComponent(params.emailOrCode);
    const customer = cachedCustomers.find(
      (c) => c.customerCode === key || c.email.toLowerCase() === key.toLowerCase()
    );
    if (!customer) {
      return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return HttpResponse.json(customer);
  }),

  // ─── POST /api/customers ───
  http.post('/api/customers', async ({ request }) => {
    await delay(800);
    const body = await request.json();
    const email = (body.email || '').toLowerCase();

    if (cachedCustomers.some((c) => c.email.toLowerCase() === email)) {
      return HttpResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const customer = {
      id: 907100000 + cachedCustomers.length + Math.floor(Math.random() * 1000),
      customerCode: `CUS_${(Math.random().toString(36) + '000000000000').slice(2, 16)}`,
      email: body.email,
      firstName,
      lastName,
      phone: (body.phone || '').trim(),
      metadata: body.metadata || {},
      riskAction: 'default',
      domain: 'test',
      createdAt: now,
      updatedAt: now,
      displayName: `${firstName} ${lastName}`.trim() || body.email.split('@')[0],
    };

    cachedCustomers = [customer, ...cachedCustomers];
    return HttpResponse.json(customer, { status: 201 });
  }),

  // ─── PUT /api/customers/:code ───
  http.put('/api/customers/:code', async ({ params, request }) => {
    await delay(800);
    const code = decodeURIComponent(params.code);
    const index = cachedCustomers.findIndex((c) => c.customerCode === code);
    if (index === -1) {
      return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    const body = await request.json();
    const existing = cachedCustomers[index];

    const firstName = body.firstName !== undefined ? String(body.firstName).trim() : existing.firstName;
    const lastName = body.lastName !== undefined ? String(body.lastName).trim() : existing.lastName;
    const phone = body.phone !== undefined ? String(body.phone).trim() : existing.phone;

    const updated = {
      ...existing,
      firstName,
      lastName,
      phone,
      metadata: body.metadata !== undefined ? body.metadata : existing.metadata,
      displayName: `${firstName} ${lastName}`.trim() || existing.email.split('@')[0],
      updatedAt: new Date().toISOString(),
    };

    cachedCustomers = cachedCustomers.map((c, i) => (i === index ? updated : c));
    return HttpResponse.json(updated);
  }),

  // ─── POST /api/customers/risk-action ───
  http.post('/api/customers/risk-action', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const index = cachedCustomers.findIndex(
      (c) => c.customerCode === body.customer || c.email.toLowerCase() === String(body.customer).toLowerCase()
    );
    if (index === -1) {
      return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updated = {
      ...cachedCustomers[index],
      riskAction: body.riskAction || 'default',
      updatedAt: new Date().toISOString(),
    };
    cachedCustomers = cachedCustomers.map((c, i) => (i === index ? updated : c));
    return HttpResponse.json(updated);
  }),

  // ─── GET /api/customers/:emailOrCode/transactions ───
  http.get('/api/customers/:emailOrCode/transactions', async ({ params, request }) => {
    await delay(600);
    const key = decodeURIComponent(params.emailOrCode);
    const customer = cachedCustomers.find(
      (c) => c.customerCode === key || c.email.toLowerCase() === key.toLowerCase()
    );
    if (!customer) {
      return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = Math.max(1, parseInt(url.searchParams.get('perPage') || '10', 10));
    const matching = cachedTransactions.filter((t) => t.customerCode === customer.customerCode);
    const start = (page - 1) * perPage;
    const transactions = matching.slice(start, start + perPage);

    return HttpResponse.json({
      transactions,
      pagination: {
        perPage,
        page,
        next: start + perPage < matching.length ? String(page + 1) : null,
        previous: page > 1 ? String(page - 1) : null,
      },
    });
  }),
];
