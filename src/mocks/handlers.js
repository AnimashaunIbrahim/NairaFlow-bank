/**
 * MSW Handlers — mock API endpoints for the NairaFlow fintech dashboard.
 * These intercept fetch() at the network level.
 */
import { http, HttpResponse, delay } from 'msw';
import { generateTransactions, SAVINGS_PLANS, EXCHANGE_RATES } from './data';

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
];
