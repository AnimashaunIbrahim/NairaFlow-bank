import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBalance, fetchTransactions } from '../lib/api';
import VerdictRow from '../components/VerdictRow';
import MoneyInMotion from '../components/MoneyInMotion';
import TransactionFeed from '../components/TransactionFeed';
import CurrencyConverter from '../components/CurrencyConverter';
import InsightsPanel from '../components/InsightsPanel';

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');

  const balanceQuery = useQuery({ queryKey: ['balance'], queryFn: fetchBalance });
  const txQuery = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions });

  const transactions = txQuery.data ?? [];
  const pending = transactions.filter(tx => tx.status === 'pending').length;
  const completed = transactions.filter(tx => tx.status === 'success').length;
  const failed = transactions.filter(tx => tx.status === 'failed').length;

  return (
    <>
      <title>Dashboard — NairaFlow</title>
      <div className="flex flex-col gap-6">
        {/* Verdict Row */}
        {balanceQuery.isPending ? (
          <div className="h-40 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />
        ) : balanceQuery.isError ? (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)' }}>Failed to load balance</p>
            <button onClick={() => balanceQuery.refetch()} className="mt-2 text-sm underline cursor-pointer">Retry</button>
          </div>
        ) : (
          <VerdictRow
            balanceKobo={balanceQuery.data.amount}
            currency={balanceQuery.data.currency}
            trend={balanceQuery.data.trend}
            userName="Chinedu"
          />
        )}

        {/* Money in Motion */}
        <MoneyInMotion pending={pending} inFlight={0} completed={completed} />

        {/* Money in Motion */}
        {/* <MoneyInMotion pending={pending} inFlight={0} completed={completed} /> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Feed */}
          <div className="col-span-2">
            <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
            {txQuery.isPending ? (
              <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-3 w-20 rounded" style={{ background: 'var(--color-border)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded" style={{ background: 'var(--color-border)' }} />
                      <div className="h-3 w-32 rounded" style={{ background: 'var(--color-border)' }} />
                    </div>
                    <div className="h-4 w-24 rounded" style={{ background: 'var(--color-border)' }} />
                  </div>
                ))}
              </div>
            ) : txQuery.isError ? (
              <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-error)' }}>
                <p style={{ color: 'var(--color-error)' }}>Failed to load transactions</p>
                <button onClick={() => txQuery.refetch()} className="mt-2 text-sm underline cursor-pointer">Retry</button>
              </div>
            ) : (
              <TransactionFeed transactions={transactions} filter={filter} onFilterChange={setFilter} />
            )}
          </div>

          <div className="col-span-1 space-y-6">
            <CurrencyConverter />
            <InsightsPanel />
          </div>
        </div>
      </div>
    </>
  );
}
