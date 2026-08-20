type Props = {
  x: number;
  y: number;
  name: string;
  value: string;
  region?: string;
};

export function MapTooltip({ x, y, name, value, region }: Props) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 min-w-36 rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <div className="text-sm font-medium">{name}</div>
      {region && <div className="text-xs text-muted-foreground">{region}</div>}
      <div className="mt-1 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
