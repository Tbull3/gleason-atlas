import type { ReactNode } from "react";
import { Minus, Plus, RotateCcw, RotateCw, Maximize2, Ruler, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAtlas } from "@/lib/atlas-store";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function MapControls({ onZoomIn, onZoomOut, onReset }: Props) {
  const viewMode = useAtlas((s) => s.viewMode);
  const setRotation = useAtlas((s) => s.setRotation);
  const setTurn = useAtlas((s) => s.setTurn);
  const measureMode = useAtlas((s) => s.measureMode);
  const setMeasureMode = useAtlas((s) => s.setMeasureMode);
  const setViewMode = useAtlas((s) => s.setViewMode);
  const viewerPin = useAtlas((s) => s.viewerPin);
  const placingPin = useAtlas((s) => s.placingPin);
  const setViewerPin = useAtlas((s) => s.setViewerPin);
  const setPlacingPin = useAtlas((s) => s.setPlacingPin);
  const setClockOpen = useAtlas((s) => s.setClockOpen);
  const spatial = viewMode !== "plan";

  function markPlace() {
    if (placingPin) {
      setPlacingPin(false);
      return;
    }
    if (viewerPin) {
      setViewerPin(null);
      return;
    }
    setMeasureMode(false);
    if (!navigator.geolocation) {
      setViewMode("plan");
      setPlacingPin(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setViewerPin({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "You",
        });
        setClockOpen(true);
      },
      () => {
        setViewMode("plan");
        setPlacingPin(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function rotateWest() {
    if (spatial) setTurn((t) => t - 18);
    else setRotation((r) => r - 15);
  }

  function rotateEast() {
    if (spatial) setTurn((t) => t + 18);
    else setRotation((r) => r + 15);
  }

  return (
    <div className="absolute right-3 bottom-24 z-10 flex flex-col gap-1 sm:right-5 sm:bottom-6">
      <Control label="Zoom in" onClick={onZoomIn}>
        <Plus />
      </Control>
      <Control label="Zoom out" onClick={onZoomOut}>
        <Minus />
      </Control>
      <Control label="Reset view" onClick={onReset}>
        <Maximize2 />
      </Control>
      <Control
        label={measureMode ? "Hide distance" : "Show distance"}
        onClick={() => {
          setMeasureMode((on) => {
            const next = !on;
            if (next) setViewMode("plan");
            return next;
          });
        }}
        pressed={measureMode}
      >
        <Ruler />
      </Control>
      <Control
        label={
          placingPin
            ? "Click the disc to place yourself"
            : viewerPin
              ? "Clear my place"
              : "Mark my place"
        }
        onClick={markPlace}
        pressed={placingPin || Boolean(viewerPin)}
      >
        <MapPin />
      </Control>
      <Control
        label={spatial ? "Turn west" : "Rotate west"}
        onClick={rotateWest}
      >
        <RotateCcw />
      </Control>
      <Control
        label={spatial ? "Turn east" : "Rotate east"}
        onClick={rotateEast}
      >
        <RotateCw />
      </Control>
    </div>
  );
}

function Control({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={pressed ? "default" : "secondary"}
          size="icon"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          className="size-10 sm:size-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
