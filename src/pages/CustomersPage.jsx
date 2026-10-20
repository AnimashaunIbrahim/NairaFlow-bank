import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  setCustomerRiskAction,
} from '../lib/api';
import { customerCreateSchema } from '../lib/validators/customerValidator';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../lib/utils';

const PER_PAGE = 10;

const EMPTY_CUSTOMERS = [];

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

export default function CustomersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmRisk, setConfirmRisk] = useState(null);

  const customersQuery = useQuery({
    queryKey: ['customers', page],
    queryFn: () => fetchCustomers({ page, perPage: PER_PAGE }),
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

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      toast.success(`Customer ${customer.displayName || customer.email} created`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setModal(null);
      reset();
    },
    onError: (err) => toast.error(err.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, data }) => updateCustomer(code, data),
    onSuccess: (customer) => {
      toast.success(`Customer ${customer.displayName || customer.email} updated`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setModal(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update customer'),
  });

  const riskMutation = useMutation({
    mutationFn: ({ customerCode, riskAction }) => setCustomerRiskAction(customerCode, riskAction),
    onSuccess: (customer) => {
      const label = RISK_SUCCESS_LABELS[customer.riskAction] || 'updated';
      toast.success(`Customer ${customer.displayName || customer.email} ${label}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setConfirmRisk(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update risk action'),
  });

  const customers = customersQuery.data?.customers ?? EMPTY_CUSTOMERS;
  const pagination = customersQuery.data?.pagination;
  const savePending = createMutation.isPending || updateMutation.isPending;

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.displayName, customer.email, customer.customerCode, customer.phone].some(
        (value) => value && value.toLowerCase().includes(query)
      )
    );
  }, [customers, search]);

  function openCreate() {
    reset({ firstName: '', lastName: '', email: '', phone: '' });
    setModal({ mode: 'create' });
  }

  function openEdit(customer) {
    reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
    });
    setModal({ mode: 'edit', customer });
  }

  function requestRiskChange(customer, riskAction) {
    if (riskAction === 'deny') {
      setConfirmRisk({ customer, riskAction });
      return;
    }
    riskMutation.mutate({ customerCode: customer.customerCode, riskAction });
  }

  function onSubmit(data) {
    if (modal?.mode === 'edit') {
      // Paystack does not allow changing email — send only updatable fields
      const { firstName, lastName, phone } = data;
      updateMutation.mutate({
        code: modal.customer.customerCode,
        data: { firstName, lastName, phone },
      });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <>
      <title>Customers — NairaFlow</title>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Customers</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create and manage customers on your Paystack integration
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 self-start sm:self-auto"
            style={{ background: 'var(--color-brand)' }}
          >
            + Add Customer
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or customer code"
          className="w-full sm:max-w-sm px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
        />

        {customersQuery.isPending ? (
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full" style={{ background: 'var(--color-border)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded" style={{ background: 'var(--color-border)' }} />
                  <div className="h-3 w-64 rounded" style={{ background: 'var(--color-border)' }} />
                </div>
                <div className="h-4 w-16 rounded" style={{ background: 'var(--color-border)' }} />
              </div>
            ))}
          </div>
        ) : customersQuery.isError ? (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)' }}>Failed to load customers</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {customersQuery.error?.message}
            </p>
            <button onClick={() => customersQuery.refetch()} className="mt-2 text-sm underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-xl border p-10 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <span className="text-4xl inline-block mb-2">👥</span>
            <p className="font-semibold">No customers yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create your first customer to get started.
            </p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: 'var(--color-brand)' }}
            >
              + Add Customer
            </button>
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <p className="font-semibold">No customers match "{search}"</p>
            <button onClick={() => setSearch('')} className="mt-2 text-sm underline cursor-pointer">
              Clear search
            </button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {visibleCustomers.map((customer) => {
              const risk = RISK_BADGES[customer.riskAction] || RISK_BADGES.default;
              return (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 p-4 border-b last:border-b-0 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Link
                    to={`/customers/${customer.customerCode}`}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 no-underline"
                    style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' }}
                  >
                    {getInitials(customer)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/customers/${customer.customerCode}`}
                        className="font-semibold text-sm truncate no-underline"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {customer.displayName}
                      </Link>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ color: risk.color, background: risk.background }}
                      >
                        {risk.label}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {customer.email}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                      {customer.customerCode} · Joined {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(RISK_ACTIONS[customer.riskAction] || RISK_ACTIONS.default).map((item) => (
                      <button
                        key={item.action}
                        onClick={() => requestRiskChange(customer, item.action)}
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
                      onClick={() => openEdit(customer)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        background: 'var(--color-surface-alt)',
                        color: 'var(--color-text)',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!search && pagination && customers.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              ← Previous
            </button>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Page {page}
            </span>
            <button
              disabled={!pagination.next}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              Next →
            </button>
          </div>
        )}

        {modal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setModal(null)}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {modal.mode === 'edit' ? 'Edit Customer' : 'New Customer'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModal(null)}
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
                    placeholder="Chinedu"
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
                    placeholder="Okafor"
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
                  placeholder="chinedu@email.com"
                  readOnly={modal.mode === 'edit'}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ ...inputStyle(errors.email), cursor: modal.mode === 'edit' ? 'not-allowed' : 'text' }}
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                    {errors.email.message}
                  </p>
                )}
                {modal.mode === 'edit' && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Email cannot be changed on Paystack
                  </p>
                )}
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
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--color-brand)' }}
                >
                  {savePending
                    ? 'Saving...'
                    : modal.mode === 'edit'
                      ? 'Save Changes'
                      : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        )}

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
                {confirmRisk.customer.displayName} ({confirmRisk.customer.email}) will be
                blacklisted. Paystack will decline future payment attempts from this customer.
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
                      customerCode: confirmRisk.customer.customerCode,
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
