import StatusPill from './StatusPill';
import { useState } from 'react';
import { formatKobo, formatDate, getBankName, filterTransactions } from '../lib/utils';

/**
 * TransactionRow — A single transaction in the feed.
 *
 * CONNECTION TO PHASE 1:
 * This is the SAME <article class="tx-row"> from Week 1 Day 3.
 * The Phase 1 version used CSS Grid with subgrid for column alignment.
 * Here, Tailwind's grid classes do the same.
 *
 * CONNECTION TO PHASE 2:
 * In Phase 2, renderTransactions() built HTML with template literals
 * and innerHTML (XSS risk!). React's JSX auto-escapes all values — safe!
 */


function TransactionRow({ description, bank, account, amount, status, date }) {
  return (
    <article className="grid grid-cols-[1fr_auto] md:grid-cols-[100px_1fr_auto_auto] items-center gap-2 md:gap-4 py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <time
        className="text-xs hidden md:block"
        style={{ color: 'var(--color-text-tertiary)' }}
        dateTime={date}
      >
        {formatDate(date)}
      </time>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{description}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {getBankName(bank)} · {account}
        </p>
      </div>
      <p className="text-sm font-semibold text-right" style={{ color: 'var(--color-error)' }}>
        -{formatKobo(amount)}
      </p>
      <StatusPill status={status} />
    </article>
  );
}

/**
 * TransactionFeed — The feed card containing all transaction rows.
 *
 * CONNECTION TO PHASE 2:
 * In Phase 2, the filter buttons dispatched SET_FILTER to the Store,
 * and renderTransactions() used Object.groupBy() to filter.
 * Here, useState holds the filter and the list filters declaratively.
 */
export default function TransactionFeed({ transactions, filter, onFilterChange }) {
  const [dateFilter, setDateFilter ] = useState(null);
  // Filter transactions
  // const filtered =
  //   filter === 'all'
  //     ? transactions
  //     : transactions.filter((tx) => tx.status === filter);

  // const filters = ['all', 'success', 'pending', 'failed','Transfers','TV', 'Electricity', 'Online Payment', 'Safebox', 'Connectivity'];
// Todo: we will work on dates 
  const filtered = filterTransactions(transactions, filter, dateFilter);
  
  const categoryFilter = [
    {value: 'all', label: 'All'},
    {value: 'success', label: 'Success'},
    {value: 'pending', label: 'Pending'},
    {value: 'failed', label: 'Failed'},
    {value: 'Transfers', label: 'Transfers'},
    {value: 'Electricity', label: 'Electricity'},
    {value: 'Connectivity', label: 'Connectivity'},
    {value: 'TV', label: 'TV'},
    {value: 'Online Payment', label: 'Online Payment'},
    {value: 'Safebox', label: 'Safebox'},
  ];

  const myDateFilters = [
    {value: null, label: 'All Time'},
    {value: 'today', label: 'Today'},
    {value: 'week', label: 'Weekly'},
    {value: 'month', label: 'Monthly'},
    {value: 'year', label: 'Yearly'},
  ];
  return (
    <section
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Filter bar */}
        <div className="space-y-3 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap gap-2">
            {categoryFilter.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filter === f.value
                    ? 'text-white'
                    : 'hover:opacity-80'
                }`}
                style={
                  filter === f.value
                    ? { background: 'var(--color-brand)' }
                    : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
{/* Todo : Date Filtering */}
          <div className = "flex items-center gap-2">
            <span className = "text-xs" style = {{color: 'var(--color-text-secondary)'}}>Date: </span>
            <select value = {dateFilter || 'all'}
            onChange = {(e) => setDateFilter(e.target.value === 'all' ? null : e.target.value)}
            className = 'px-2 py-1 rounded text-xs border'
            style = {{borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)'}}>
              {myDateFilters.map((f) => (
                <option key = {f.value || 'all'} value={f.value || 'all'}>
                {f.label}
                </option>
              ))}
            </select>
          </div>
      </div>


      {/* Transaction rows */}
      <div>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No transactions found for the selected filters.
            {dateFilter && ` Adjust date filter or Use All Time`}
          </p>

        ) : (
          <div>
            <p className = "px-4 py-2 text-xs" style ={{color: 'var(--color-text-tertiary)'}} >
              Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
              {dateFilter && ` for selected date range`}
            </p>
            {filtered.map((tx) => <TransactionRow key={tx.id} {...tx} />)}
          </div>
        )}
      </div>
    </section>
  );
}
