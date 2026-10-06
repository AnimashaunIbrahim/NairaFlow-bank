import { useQuery } from '@tanstack/react-query';
import { fetchInsights } from '../lib/api';

export default function InsightsPanel() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
  });

  if (isPending) {
    return (
      <section className="rounded-xl border p-6 space-y-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">✨</span>
          <h2 className="text-lg font-bold">AI Insights</h2>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: 'var(--color-border)' }} />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-xl border p-6 text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <p style={{ color: 'var(--color-error)' }} className="text-sm">Failed to load insights.</p>
        <button onClick={() => refetch()} className="text-xs underline mt-2 cursor-pointer">Retry</button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border p-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-lg font-bold">AI Insights</h2>
      </div>
      <div className="space-y-4">
        {data?.map(insight => (
          <div key={insight.id} className="flex gap-4 items-start p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
            <span className="text-2xl mt-1">{insight.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{insight.headline}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {insight.detail}
              </p>
              {/* Confidence Bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${insight.confidence * 100}%`, background: 'var(--color-brand)' }} 
                  />
                </div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {Math.round(insight.confidence * 100)}% Match
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
