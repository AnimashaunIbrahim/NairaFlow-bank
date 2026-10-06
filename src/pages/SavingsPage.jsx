import { useQuery } from '@tanstack/react-query';
import { fetchSavings } from '../lib/api';
import SavingsCard from '../components/SavingsCard';

export default function SavingsPage() {
  const { data: plans, isPending, isError, refetch } = useQuery({
    queryKey: ['savings'],
    queryFn: fetchSavings,
  });

  return (
    <>
      <title>Savings — NairaFlow</title>
      <h1 className="text-2xl font-bold mb-6">Savings Plans</h1>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-8">
          <p style={{ color: 'var(--color-error)' }}>Failed to load savings plans</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline cursor-pointer">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => <SavingsCard key={plan.id} plan={plan} />)}
        </div>
      )}
    </>
  );
}
