import { METRIC_IDS, METRICS } from "@/data/metrics";
import { useAtlas } from "@/lib/atlas-store";
import { cn } from "@/lib/utils";

export function MetricSwitcher() {
  const metric = useAtlas((s) => s.metric);
  const setMetric = useAtlas((s) => s.setMetric);

  return (
    <div
      role="tablist"
      aria-label="Map metric"
      className="flex w-full min-w-0 flex-nowrap gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {METRIC_IDS.map((id) => {
        const active = id === metric;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMetric(id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-[background-color,color] duration-150 ease-smooth-out sm:h-8 sm:text-xs",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            {METRICS[id].shortLabel}
          </button>
        );
      })}
    </div>
  );
}
