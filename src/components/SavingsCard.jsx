import { useState } from 'react';
import { formatKobo } from '../lib/utils';

export default function SavingsCard({ plan }) {
  const [locked, setLocked] = useState(plan.locked);
  const progress = Math.round((plan.current / plan.target) * 100);

  return (
    <div
      onClick={() => setLocked(prev => !prev)}
      className={`rounded-xl border p-5 cursor-pointer transition-all ${locked ? 'opacity-70' : ''}`}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{plan.name}</h3>
        <span className="text-lg">{locked ? '🔒' : '🔓'}</span>
      </div>
      <p className="text-xl font-bold">{formatKobo(plan.current)}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        of {formatKobo(plan.target)} target
      </p>
      {/* Progress bar */}
      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, background: 'var(--color-brand)' }}
        />
      </div>
      <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{progress}%</span>
        <span>{plan.apy}% APY</span>
      </div>
    </div>
  );
}
