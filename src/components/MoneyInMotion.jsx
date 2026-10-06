/**
 * MoneyInMotion — The 3-column transfer status strip.
 *
 * CONNECTION TO PHASE 1:
 * This is the SAME "Money in Motion" strip from Week 1 Day 3 that used
 * CSS Grid with subgrid. Now it uses Tailwind grid classes.
 *
 * CONNECTION TO PHASE 2:
 * In Phase 2, the counts were derived from state via Object.groupBy().
 * Here, the parent component computes the counts and passes them as props.
 */
export default function MoneyInMotion({ pending, inFlight, completed }) {
  const items = [
    { icon: '⏳', count: pending, label: 'Pending', color: 'text-amber-600' },
    { icon: '✈️', count: inFlight, label: 'In-Flight', color: 'text-blue-600' },
    { icon: '✅', count: completed, label: 'Completed', color: 'text-green-600' },
  ];

  return (
    <section
      className="grid grid-cols-3 gap-4 rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      aria-label="Transfer status summary"
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl">{item.icon}</span>
          <span className={`text-2xl font-bold ${item.color}`}>{item.count}</span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {item.label}
          </span>
        </div>
      ))}
    </section>
  );
}
