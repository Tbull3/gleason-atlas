import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import "d3-transition";
import { geoPath } from "d3-geo";
import {
  MAP_SIZE,
  MAP_RADIUS,
  createGleasonProjection,
  createGraticulePath,
  createEquatorPath,
  createRimMarks,
  createPath,
  spherePath,
  GEO_COUNTRIES,
} from "@/lib/geo";
import { createColorScale } from "@/lib/color-scale";
import { ANTARCTICA_KEY, metricValue } from "@/data/countries";
import { METRICS, formatMetric } from "@/data/metrics";
import { useAtlas } from "@/lib/atlas-store";
import { MapTooltip } from "@/components/map-tooltip";
import { MapLegend } from "@/components/map-legend";
import { MapControls } from "@/components/map-controls";

type TooltipState = {
  x: number;
  y: number;
  name: string;
  value: string;
  region?: string;
} | null;

type DrawnCountry = {
  key: string;
  d: string;
  name: string;
  region?: string;
  value: number | null;
};

export function GleasonMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef(zoomIdentity);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const metric = useAtlas((s) => s.metric);
  const rotation = useAtlas((s) => s.rotation);
  const selectedKey = useAtlas((s) => s.selectedKey);
  const hoveredKey = useAtlas((s) => s.hoveredKey);
  const focusToken = useAtlas((s) => s.focusToken);
  const setSelectedKey = useAtlas((s) => s.setSelectedKey);
  const setHoveredKey = useAtlas((s) => s.setHoveredKey);

  const projection = useMemo(
    () => createGleasonProjection(rotation),
    [rotation],
  );
  const pathGen = useMemo(() => createPath(projection), [projection]);
  const ocean = useMemo(() => spherePath(projection), [projection]);
  const graticule = useMemo(
    () => createGraticulePath(projection),
    [projection],
  );
  const equator = useMemo(() => createEquatorPath(projection), [projection]);
  const rimMarks = useMemo(() => createRimMarks(projection), [projection]);
  const scale = useMemo(() => createColorScale(metric), [metric]);
  const nodata = "var(--color-nodata)";
  const ice = "var(--color-ice)";

  const countries = useMemo<DrawnCountry[]>(
    () =>
      GEO_COUNTRIES.map((c) => ({
        key: c.key,
        d: pathGen(c.feature) ?? "",
        name: c.record?.name ?? c.geoName,
        region: c.record?.region,
        value: metricValue(c.record, metric),
      })),
    [pathGen, metric],
  );

  const latLabels = useMemo(() => {
    const lats = [60, 30, 0, -30, -60];
    return lats
      .map((lat) => {
        const p = projection([8, lat]);
        if (!p) return null;
        const label =
          lat === 0 ? "Equator" : lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`;
        return { x: p[0], y: p[1], label };
      })
      .filter(Boolean) as { x: number; y: number; label: string }[];
  }, [projection]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = select(svgEl);
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.75, 16])
      .extent([
        [0, 0],
        [MAP_SIZE, MAP_SIZE],
      ])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        zoomLayerRef.current?.setAttribute(
          "transform",
          event.transform.toString(),
        );
      });
    svg.call(z);
    zoomRef.current = z;
    svg.on("dblclick.zoom", null);
    return () => {
      svg.on(".zoom", null);
      zoomRef.current = null;
    };
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z || !selectedKey) return;
    const country = GEO_COUNTRIES.find((c) => c.key === selectedKey);
    if (!country) return;
    const bounds = geoPath(projection).bounds(country.feature);
    const [[x0, y0], [x1, y1]] = bounds;
    const w = Math.max(x1 - x0, 8);
    const h = Math.max(y1 - y0, 8);
    const k = Math.min(10, 0.62 / Math.max(w / MAP_SIZE, h / MAP_SIZE));
    const tx = MAP_SIZE / 2 - (k * (x0 + x1)) / 2;
    const ty = MAP_SIZE / 2 - (k * (y0 + y1)) / 2;
    const next = zoomIdentity.translate(tx, ty).scale(k);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    select(svgEl)
      .transition()
      .duration(reduce ? 0 : 700)
      .call(z.transform, next);
    // focusToken is the trigger; selectedKey identifies the target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedKey(null);
        setTooltip(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedKey]);

  function motionDuration(ms: number) {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return 0;
    }
    return ms;
  }

  function resetView() {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z) return;
    select(svgEl)
      .transition()
      .duration(motionDuration(480))
      .call(z.transform, zoomIdentity);
  }

  function zoomBy(factor: number) {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z) return;
    select(svgEl)
      .transition()
      .duration(motionDuration(220))
      .call(z.scaleBy, factor);
  }

  const colorFor = useCallback(
    (key: string, value: number | null) => {
      if (key === ANTARCTICA_KEY) return ice;
      if (value == null) return nodata;
      return scale.color(value);
    },
    [scale, ice, nodata],
  );

  const showTip = useCallback(
    (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => {
      const rect = svgRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const flipX = px > rect.width * 0.62;
      const flipY = py > rect.height * 0.72;
      const x = flipX ? px - 176 : px + 14;
      const y = flipY ? py - 72 : py + 14;
      setTooltip({
        x: Math.max(8, Math.min(x, rect.width - 176)),
        y: Math.max(8, Math.min(y, rect.height - 78)),
        name: country.name,
        region: country.region,
        value:
          country.value == null ? "No data" : formatMetric(metric, country.value),
      });
    },
    [metric],
  );

  const onEnter = useCallback(
    (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => {
      setHoveredKey(country.key);
      showTip(event, country);
    },
    [setHoveredKey, showTip],
  );

  const onMove = useCallback(
    (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => {
      showTip(event, country);
    },
    [showTip],
  );

  const onLeave = useCallback(() => {
    setHoveredKey(null);
    setTooltip(null);
  }, [setHoveredKey]);

  const onSelect = useCallback(
    (key: string, active: boolean) => {
      setSelectedKey(active ? null : key);
    },
    [setSelectedKey],
  );

  const pole = projection([0, 90]);
  const def = METRICS[metric];
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-background select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label={`Gleason polar map colored by ${def.label}`}
        onDoubleClick={resetView}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedKey(null);
        }}
      >
        <rect
          width={MAP_SIZE}
          height={MAP_SIZE}
          fill="var(--color-background)"
          onClick={() => setSelectedKey(null)}
        />
        <g
          ref={zoomLayerRef}
          transform={transformRef.current.toString()}
        >
          <circle
            cx={cx}
            cy={cy}
            r={MAP_RADIUS + 14}
            className="map-outer-ring"
            pointerEvents="none"
          />
          <path
            d={ocean}
            className="map-sphere"
            onClick={() => setSelectedKey(null)}
          />
          <path d={graticule} className="map-graticule" pointerEvents="none" />
          <path d={equator} className="map-equator" pointerEvents="none" />
          <CountryLayer
            countries={countries}
            selectedKey={selectedKey}
            hoveredKey={hoveredKey}
            colorFor={colorFor}
            onEnter={onEnter}
            onMove={onMove}
            onLeave={onLeave}
            onSelect={onSelect}
          />
          {pole && (
            <circle
              cx={pole[0]}
              cy={pole[1]}
              r={3.2}
              fill="var(--color-foreground)"
              pointerEvents="none"
            />
          )}
          {latLabels.map((l) => (
            <text
              key={l.label}
              x={l.x + 6}
              y={l.y}
              className="map-lat-label"
              pointerEvents="none"
            >
              {l.label}
            </text>
          ))}
          {rimMarks.map((m, i) => (
            <g key={i} pointerEvents="none">
              <line
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                className={m.major ? "rim-tick rim-tick-major" : "rim-tick"}
              />
              {m.label && (
                <text
                  x={m.lx}
                  y={m.ly}
                  className="rim-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {m.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
      <MapLegend scale={scale} metric={metric} />
      <MapControls
        onZoomIn={() => zoomBy(1.35)}
        onZoomOut={() => zoomBy(1 / 1.35)}
        onReset={resetView}
      />
      {tooltip && <MapTooltip {...tooltip} />}
    </div>
  );
}

const CountryLayer = memo(function CountryLayer({
  countries,
  selectedKey,
  hoveredKey,
  colorFor,
  onEnter,
  onMove,
  onLeave,
  onSelect,
}: {
  countries: DrawnCountry[];
  selectedKey: string | null;
  hoveredKey: string | null;
  colorFor: (key: string, value: number | null) => string;
  onEnter: (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => void;
  onMove: (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => void;
  onLeave: () => void;
  onSelect: (key: string, active: boolean) => void;
}) {
  return (
    <g>
      {countries.map((c) => {
        const active = c.key === selectedKey;
        const hovered = c.key === hoveredKey;
        const dimmed = Boolean(selectedKey) && !active;
        return (
          <path
            key={c.key}
            d={c.d}
            className="country-path"
            data-active={active ? "true" : undefined}
            data-hovered={hovered ? "true" : undefined}
            data-dimmed={dimmed ? "true" : undefined}
            style={{ fill: colorFor(c.key, c.value) }}
            aria-label={c.name}
            onMouseEnter={(e) => onEnter(e, c)}
            onMouseMove={(e) => onMove(e, c)}
            onMouseLeave={onLeave}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(c.key, active);
            }}
          />
        );
      })}
    </g>
  );
});
