import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  fetchCustomer,
  fetchCustomerTransactions,
  updateCustomer,
  setCustomerRiskAction,
} from '../lib/api';
import { customerCreateSchema } from '../lib/validators/customerValidator';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatKobo } from '../lib/utils';

const RISK_BADGES = {
  allow: { label: 'Whitelisted', color: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' },
  deny: { label: 'Blacklisted', color: '#dc2626', background: 'rgba(220, 38, 38, 0.12)' },
  default: { label: 'Default', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)' },
};

const RISK_ACTIONS = {
  default: [
    { action: 'allow', label: 'Whitelist' },
    { action: 'deny', label: 'Blacklist' },
  ],
  allow: [
    { action: 'default', label: 'Reset' },
    { action: 'deny', label: 'Blacklist' },
  ],
  deny: [
    { action: 'allow', label: 'Whitelist' },
    { action: 'default', label: 'Reset' },
  ],
};

const RISK_SUCCESS_LABELS = {
  allow: 'whitelisted',
  deny: 'blacklisted',
  default: 'reset to default',
};

const TX_STATUS_STYLES = {
  success: { label: 'Success', color: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' },
  failed: { label: 'Failed', color: '#dc2626', background: 'rgba(220, 38, 38, 0.12)' },
  pending: { label: 'Pending', color: '#d97706', background: 'rgba(217, 119, 6, 0.12)' },
};

function getInitials(customer) {
  const first = (customer.firstName || '').trim();
  const last = (customer.lastName || '').trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.substring(0, 2).toUpperCase();
  if (customer.email) return customer.email[0].toUpperCase();
  return '?';
}

const inputStyle = (hasError) => ({
  borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
  background: 'var(--color-surface-alt)',
  color: 'var(--color-text)',
});

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-xs font-medium sm:w-40 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span className="text-sm break-all" style={{ color: 'var(--color-text)' }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { code } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmRisk, setConfirmRisk] = useState(null);

  const customerQuery = useQuery({
    queryKey: ['customer', code],
    queryFn: () => fetchCustomer(code),
    enabled: Boolean(code),
  });

  const customer = customerQuery.data;

  const transactionsQuery = useQuery({
    queryKey: ['customer', code, 'transactions'],
    queryFn: () => fetchCustomerTransactions(customer.id, { perPage: 20 }),
    enabled: Boolean(customer?.id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  const updateMutation = useMutation({
    mutationFn: ({ code: customerCode, data }) => updateCustomer(customerCode, data),
    onSuccess: (updated) => {
      toast.success(`Customer ${updated.displayName || updated.email} updated`);
      queryClient.invalidateQueries({ queryKey: ['customer', code] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to update customer'),
  });

  const riskMutation = useMutation({
    mutationFn: ({ customerCode, riskAction }) => setCustomerRiskAction(customerCode, riskAction),
    onSuccess: (updated) => {
      const label = RISK_SUCCESS_LABELS[updated.riskAction] || 'updated';
      toast.success(`Customer ${updated.displayName || updated.email} ${label}`);
      queryClient.invalidateQueries({ queryKey: ['customer', code] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setConfirmRisk(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update risk action'),
  });

  function openEdit() {
    reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
    });
    setEditOpen(true);
  }

  function requestRiskChange(riskAction) {
    if (riskAction === 'deny') {
      setConfirmRisk({ riskAction });
      return;
    }
    riskMutation.mutate({ customerCode: customer.customerCode, riskAction });
  }

  function onSubmit(data) {
    // Paystack does not allow changing email — send only updatable fields
    const { firstName, lastName, phone } = data;
    updateMutation.mutate({
      code: customer.customerCode,
      data: { firstName, lastName, phone },
    });
  }

  if (customerQuery.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-40 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-14 w-14 rounded-full" style={{ background: 'var(--color-border)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 rounded" style={{ background: 'var(--color-border)' }} />
              <div className="h-4 w-64 rounded" style={{ background: 'var(--color-border)' }} />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="flex flex-col gap-6">
        <Link to="/customers" className="text-sm underline" style={{ color: 'var(--color-text-secondary)' }}>
          ← Back to customers
        </Link>
        <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)' }}>Failed to load customer</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {customerQuery.error?.message}
          </p>
          <button onClick={() => customerQuery.refetch()} className="mt-2 text-sm underline cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const risk = RISK_BADGES[customer.riskAction] || RISK_BADGES.default;
  const authorizations = customer.authorizations || [];
  const transactions = transactionsQuery.data?.transactions ?? [];

  return (
    <>
      <title>{customer.displayName} — NairaFlow</title>
      <div className="flex flex-col gap-6">
        <Link to="/customers" className="text-sm underline" style={{ color: 'var(--color-text-secondary)' }}>
          ← Back to customers
        </Link>

        {/* Profile header */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
              style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' }}
            >
              {getInitials(customer)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{customer.displayName}</h1>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: risk.color, background: risk.background }}
                >
                  {risk.label}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {customer.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {customer.customerCode} · Joined {formatDate(customer.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {(RISK_ACTIONS[customer.riskAction] || RISK_ACTIONS.default).map((item) => (
                <button
                  key={item.action}
                  onClick={() => requestRiskChange(item.action)}
                  disabled={riskMutation.isPending}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface-alt)',
                    color: item.action === 'deny' ? '#dc2626' : 'var(--color-text)',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={openEdit}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-brand)' }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <h2 className="text-sm font-bold mb-2">Details</h2>
          <DetailRow label="Email" value={customer.email} />
          <DetailRow label="Phone" value={customer.phone} />
          <DetailRow label="Customer code" value={customer.customerCode} />
          <DetailRow label="Risk action" value={risk.label} />
          <DetailRow label="Environment" value={customer.domain} />
          <DetailRow label="Joined" value={formatDate(customer.createdAt)} />
          <DetailRow label="Last updated" value={formatDate(customer.updatedAt)} />
        </div>

        {/* Saved authorizations */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <h2 className="text-sm font-bold mb-3">Saved authorizations</h2>
          {authorizations.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No saved authorizations
            </p>
          ) : (
            <div className="space-y-3">
              {authorizations.map((auth) => (
                <div
                  key={auth.authorization_code}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold capitalize">
                      {auth.brand || auth.card_type || auth.channel} •••• {auth.last4}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {auth.bank} · Expires {auth.exp_month}/{auth.exp_year} · {auth.channel}
                    </p>
                  </div>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{
                      color: auth.reusable ? '#16a34a' : 'var(--color-text-secondary)',
                      background: auth.reusable ? 'rgba(22, 163, 74, 0.12)' : 'var(--color-surface)',
                    }}
                  >
                    {auth.reusable ? 'Reusable' : 'One-time'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <h2 className="text-sm font-bold mb-3">Transactions</h2>
          {transactionsQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                Failed to load transactions
              </p>
              <button onClick={() => transactionsQuery.refetch()} className="mt-1 text-sm underline cursor-pointer">
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const status = TX_STATUS_STYLES[tx.status] || TX_STATUS_STYLES.pending;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{tx.description}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {tx.reference} · {formatDate(tx.date)}{tx.channel ? ` · ${tx.channel}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatKobo(tx.amount)}</p>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ color: status.color, background: status.background }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit modal */}
        {editOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setEditOpen(false)}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Edit Customer</h2>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-lg border text-sm cursor-pointer"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    {...register('firstName')}
                    id="firstName"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle(errors.firstName)}
                  />
                  {errors.firstName && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    {...register('lastName')}
                    id="lastName"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle(errors.lastName)}
                  />
                  {errors.lastName && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  Email address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ ...inputStyle(errors.email), cursor: 'not-allowed' }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  Email cannot be changed on Paystack
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  {...register('phone')}
                  id="phone"
                  placeholder="+2348123456789"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle(errors.phone)}
                />
                {errors.phone && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--color-brand)' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blacklist confirmation */}
        {confirmRisk && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setConfirmRisk(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border p-6 w-full max-w-sm space-y-4 shadow-2xl"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h2 className="text-lg font-bold">Blacklist customer?</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {customer.displayName} ({customer.email}) will be blacklisted. Paystack will
                decline future payment attempts from this customer.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmRisk(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={riskMutation.isPending}
                  onClick={() =>
                    riskMutation.mutate({
                      customerCode: customer.customerCode,
                      riskAction: 'deny',
                    })
                  }
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  style={{ background: '#dc2626' }}
                >
                  {riskMutation.isPending ? 'Blacklisting...' : 'Blacklist'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
