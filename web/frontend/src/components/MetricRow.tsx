import type { Sourced } from "@/lib/types";
import { provenanceLabel } from "@/lib/format";

type Props<T> = {
  label: string;
  field: Sourced<T> | undefined;
  format: (v: T | null | undefined) => string;
  /** Optional context for the value (e.g., "of 3,484 IEP students") */
  context?: string;
};

/**
 * One metric row with an inline provenance tooltip (`title` attr).
 * Renders "—" when the field is unset or its value is null (suppressed).
 */
export function MetricRow<T>({ label, field, format, context }: Props<T>) {
  const value = field?.value;
  const tooltip = provenanceLabel(field);
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-600 dark:text-zinc-400" title={tooltip}>
        {label}
      </span>
      <span className="text-right">
        <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {format(value as T | null | undefined)}
        </span>
        {context && (
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-500">{context}</span>
        )}
      </span>
    </div>
  );
}
