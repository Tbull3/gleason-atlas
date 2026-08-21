import { Compass, Info } from "lucide-react";
import { GleasonMap } from "@/components/gleason-map";
import { CountryPanel } from "@/components/country-panel";
import { MetricSwitcher } from "@/components/metric-switcher";
import { CountrySearch } from "@/components/country-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { METRICS } from "@/data/metrics";
import { useAtlas } from "@/lib/atlas-store";

export function AtlasApp() {
  const metric = useAtlas((s) => s.metric);
  const def = METRICS[metric];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Compass className="size-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="font-display text-lg leading-none tracking-tight">
                Gleason Atlas
              </p>
              <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
                {def.label}
              </p>
            </div>
          </div>
          <div className="ml-auto hidden md:block">
            <CountrySearch />
          </div>
          <AboutDialog />
        </div>
        <div className="min-w-0 w-full">
          <MetricSwitcher />
        </div>
        <div className="md:hidden">
          <CountrySearch />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          <GleasonMap />
        </div>
        <CountryPanel />
      </div>
    </div>
  );
}

function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="About this map"
          className="text-muted-foreground"
        >
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gleason’s world map</DialogTitle>
          <DialogDescription>
            An azimuthal equidistant projection with the North Pole at the
            centre — the arrangement Alexander Gleason published in 1892 as
            the New Standard Map of the World.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Distances and bearings from the pole are true. Land shapes hold
            near the Arctic and stretch toward the outer ice of Antarctica.
            The equator is the circle halfway to the rim.
          </p>
          <p>
            The 1892 sheet printed a scale of geographical miles (one minute
            of arc) and statute miles, with June and December solstice
            diagrams in the lower corners. Distance mode shows that scale,
            the four cardinal meridians — Greenwich, 90°E, 180°, and 90°W —
            meeting the ice at the four corners of the disc, and lets you
            click two points to measure along the map.
          </p>
          <p>
            Four viewing planes: overhead looks down the polar axis; from
            the pole stands at the centre and looks out to the ice; from
            the rim stands at the outer ice and looks in toward the pole;
            transverse is the same disc seen across a meridian, nearly
            edge-on. In the side views, drag to turn the disc, or use the
            rotate buttons and arrow keys.
          </p>
          <p>
            The sun and moon sit at their true overhead points for this
            instant — the same subsolar and sublunar positions Gleason’s
            time arms were meant to track. Each body is drawn 33 statute
            miles across and 3,000 statute miles above the disc, on the
            map’s geographical-mile scale. Switch to a side view to see
            the height. The solid arm is solar noon; the dashed arm is
            your civil meridian. The clock follows the viewer’s timezone,
            with Central as a pin.
          </p>
          <p>
            Countries are colored by the selected metric. Figures are
            illustrative 2024 estimates compiled for this atlas — useful for
            comparison, not official statistics. Hover for a reading, click
            for the full country sheet.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
