import { CircleDot, Cylinder, FlipHorizontal, LocateFixed } from "lucide-react";
import { VIEW_MODES, VIEW_PRESETS, type ViewMode } from "@/lib/view-modes";
import { useAtlas } from "@/lib/atlas-store";
import { cn } from "@/lib/utils";

const ICONS: Record<ViewMode, typeof CircleDot> = {
  plan: CircleDot,
  pole: LocateFixed,
  rim: Cylinder,
  transverse: FlipHorizontal,
};

export function ViewSwitcher() {
  const viewMode = useAtlas((s) => s.viewMode);
  const setViewMode = useAtlas((s) => s.setViewMode);
  const hint = VIEW_PRESETS[viewMode].hint;

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-10 flex max-w-[min(100%-1.5rem,32rem)] flex-col gap-1.5 sm:top-4 sm:left-4">
      <div
        role="radiogroup"
        aria-label="Map viewing plane"
        className="flex w-fit max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-full border border-border bg-surface/90 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {VIEW_MODES.map((id) => {
          const active = id === viewMode;
          const Icon = ICONS[id];
          const preset = VIEW_PRESETS[id];
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={preset.label}
              title={preset.hint}
              onClick={() => setViewMode(id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-[background-color,color] duration-150 ease-smooth-out sm:h-8 sm:px-2.5 sm:text-xs",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {preset.shortLabel}
            </button>
          );
        })}
      </div>
      {viewMode !== "plan" && (
        <p className="max-w-64 px-1 text-xs leading-snug text-muted-foreground">
          <span className="sm:hidden">Drag to turn</span>
          <span className="hidden sm:inline">{hint}. Drag to turn.</span>
        </p>
      )}
    </div>
  );
}
