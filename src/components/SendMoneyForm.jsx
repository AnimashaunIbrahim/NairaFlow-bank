import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { sendTransfer, fetchBalance } from '../lib/api';
import { formatKobo } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

const transferSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits'),
  bankCode: z.string().min(1, 'Please select a bank'),
  amount: z.coerce.number().positive('Must be greater than 0').max(10000000, 'Max ₦100,000'),
  currency: z.enum(['NGN', 'USD', 'GBP', 'EUR', 'CAD']),
  narration: z.string().max(100, 'Max 100 characters').optional(),
});

const BANK_GROUPS = {
  commercial: [
    { code: '101', name: 'GTBank' },
    { code: '044', name: 'Access Bank' },
    { code: '401', name: 'Zenith Bank' },
    { code: '501', name: 'UBA' },
    { code: '012', name: 'Fidelity Bank' },
    { code: '103', name: 'Kuda Bank' },
    { code: '050', name: 'Ecobank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '076', name: 'Polaris Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '215', name: 'Unity Bank' },
    { code: '301', name: 'Jaiz Bank' },
  ],
  digital: [
    { code: '201', name: 'OPay' },
    { code: '100', name: 'Providus Bank' },
    { code: '313', name: 'Titan Trust Bank' },
    { code: '503', name: 'VFD Microfinance Bank' },
],
};

// Helper function to get bank name from code
function getBankName(code) {
  const allBanks = [...BANK_GROUPS.commercial, ...BANK_GROUPS.digital];
  const bank = allBanks.find(b => b.code === code);
  return bank?.name || `Bank ${code}`;
}


export default function SendMoneyForm() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch current balance to show available funds and validate transfers
  const balanceQuery = useQuery({ queryKey: ['balance'], queryFn: fetchBalance });

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { currency: 'NGN' },
  });

  const mutation = useMutation({
    mutationFn: sendTransfer,
    onSuccess: (data) => {
      const newBalance = data.newBalance || balanceQuery.data?.amount;
      toast.success(`Transfer sent! Ref: ${data.reference}. New balance: ${formatKobo(newBalance)}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      reset();
    },
    onError: (err) => {
      toast.error(err.message || 'Transfer failed. Try again.');
    },
  });

  function onSubmit(data) {
    // Validate sufficient balance before sending
    const transferAmount = Number(data.amount) * 100; // Convert to kobo
    const transferFee = 15000; // 150 NGN fee in kobo
    const totalRequired = transferAmount + transferFee;
    const availableBalance = balanceQuery.data?.amount || 0;

    if (totalRequired > availableBalance) {
      toast.error(`Insufficient funds. Available: ${formatKobo(availableBalance)}, Required: ${formatKobo(totalRequired)}`);
      return;
    }

    mutation.mutate(data);
  }

  const currency = watch('currency');

  if (mutation.isSuccess) {
    return (
      <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <span className="text-5xl">✅</span>
        <h2 className="text-xl font-bold mt-4">Transfer Successful!</h2>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Reference: {mutation.data.reference}
        </p>
        <button
          onClick={() => mutation.reset()}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
          style={{ background: 'var(--color-brand)' }}
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border p-6 space-y-4"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h2 className="text-lg font-bold">Send Money</h2>

      {/* Available Balance Display */}
      {balanceQuery.data && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Available Balance: </span>
          <span className="font-semibold">{formatKobo(balanceQuery.data.amount)}</span>
        </div>
      )}

      {/* Account Number */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="accountNumber">Account Number</label>
        <input
          {...register('accountNumber')}
          id="accountNumber"
          placeholder="0123456789"
          inputMode="numeric"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: errors.accountNumber ? 'var(--color-error)' : 'var(--color-border)', background: 'var(--color-surface-alt)' }}
        />
        {errors.accountNumber && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.accountNumber.message}</p>}
      </div>

      {/* Bank */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="bankCode">Bank</label>
        <select
          {...register('bankCode')}
          id="bankCode"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: errors.bankCode ? 'var(--color-error)' : 'var(--color-border)', background: 'var(--color-surface-alt)' }}
        >
          <option value="">Select a bank</option>
          <optgroup label="Commercial Banks">
            {BANK_GROUPS.commercial.map(bank => (
              <option key={bank.code} value={bank.code}>{bank.name}test</option>
            ))}
          </optgroup>
          <optgroup label="Digital Banks">
            {BANK_GROUPS.digital.map(bank => (
              <option key={bank.code} value={bank.code}>{bank.name}</option>
            ))}
          </optgroup>
        </select>
        {errors.bankCode && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.bankCode.message}</p>}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="amount">Amount</label>
          <input
            {...register('amount')}
            id="amount"
            type="number"
            placeholder="50000"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: errors.amount ? 'var(--color-error)' : 'var(--color-border)', background: 'var(--color-surface-alt)' }}
          />
          {errors.amount && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="currency">Currency</label>
          <select
            {...register('currency')}
            id="currency"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
          >
            {['NGN', 'USD', 'GBP', 'EUR', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {currency !== 'NGN' && (
        <div className="rounded-lg p-3 text-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
          ⚠️ International transfer — exchange rates apply.
        </div>
      )}

      {/* Narration */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="narration">Narration (optional)</label>
        <input
          {...register('narration')}
          id="narration"
          placeholder="e.g. School fees payment"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
        style={{ background: 'var(--color-brand)' }}
      >
        {mutation.isPending ? '⏳ Sending...' : 'Send Money'}
      </button>
    </form>
  );
}
