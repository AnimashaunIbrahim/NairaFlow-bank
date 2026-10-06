/**
 * StatusPill — A colored badge showing transaction status.
 *
 * CONNECTION TO PHASE 1:
 * This is the SAME <span class="pill pill--success"> you built in Week 1 Day 3.
 * In Phase 1, the class determined the color. Here, Tailwind classes do the same.
 *
 * CONNECTION TO PHASE 2:
 * In Phase 2, renderTransactions() generated pill HTML via template literals.
 * Now React generates it declaratively from the status prop.
 */

const STATUS_STYLES = {
  success: 'bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-300 dark:border dark:border-green-800/50',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/50',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 dark:border dark:border-red-800/50',
};

export default function StatusPill({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
