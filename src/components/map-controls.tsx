import type { ReactNode } from "react";
import { Minus, Plus, RotateCcw, RotateCw, Maximize2 } from "lucide-react";
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
  const spatial = viewMode !== "plan";

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
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={label}
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
