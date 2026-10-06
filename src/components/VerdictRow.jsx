import { formatKobo, getGreeting } from '../lib/utils';

/**
 * VerdictRow — The hero balance section of the dashboard.
 *
 * CONNECTION TO PHASE 1:
 * This is the SAME <section class="verdict-row"> you built in Week 1 Day 1.
 * In Phase 1 the data was hardcoded in HTML. Now it comes from props.
 *
 * CONNECTION TO PHASE 2:
 * In Phase 2, renderBalance(state) updated balanceAmountEl.innerHTML.
 * Now React handles the DOM update automatically when props change.
 */
export default function VerdictRow({ balanceKobo, currency, trend, userName }) {
  const formatted = formatKobo(balanceKobo);
  const [whole, decimal] = formatted.split('.');
  const greeting = getGreeting();

  return (
    <section
      className="rounded-xl p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
        color: 'white',
      }}
      aria-label="Account balance summary"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Greeting */}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold opacity-95">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-sm opacity-70 mt-1">
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className="text-sm opacity-70 uppercase tracking-wide">Total Balance</p>
          <p className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">
            {whole}
            <span className="text-xl opacity-60">.{decimal}</span>
          </p>
          <div className="flex items-center justify-end gap-2 mt-2 text-sm">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span className="opacity-70">this month</span>
          </div>
        </div>
      </div>
    </section>
  );
}
