import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
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
import {
  VIEW_PRESETS,
  DISK_RIM_SEGMENTS,
  clamp,
  nearEdgeAngle,
  wrapDeg,
  type ViewMode,
} from "@/lib/view-modes";
import { useAtlas } from "@/lib/atlas-store";
import { MapTooltip } from "@/components/map-tooltip";
import { MapLegend } from "@/components/map-legend";
import { MapControls } from "@/components/map-controls";
import { ViewSwitcher } from "@/components/view-switcher";
import { DiskRim } from "@/components/disk-rim";
import { GleasonMarks } from "@/components/gleason-marks";
import { DistanceHud } from "@/components/distance-hud";
import { CelestialBodies, CelestialOrbs } from "@/components/celestial-bodies";
import { TimeRing } from "@/components/time-ring";
import { useSkyNow } from "@/lib/use-sky-clock";
import {
  invertLonLat,
  projectMeasure,
  discMeasure,
  formatCount,
  BODY_ALTITUDE_GEO,
  BODY_DIAMETER_GEO,
  BODY_DISPLAY_SCALE,
  DISC_GEO_MILES,
  type MeasurePoint,
} from "@/lib/distance";
import {
  CENTRAL_TZ,
  formatZoneAbbrev,
  viewerTimeZone,
  zoneMeridian,
} from "@/lib/astro";

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

const RIM_RATIO = MAP_RADIUS / MAP_SIZE;
const DOLLY_MIN = 0.45;
const DOLLY_MAX = 2.6;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function motionDuration(ms: number) {
  return prefersReducedMotion() ? 0 : ms;
}

export function GleasonMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const diskRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const celestialZoomRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef(zoomIdentity);
  const viewModeRef = useRef<ViewMode>("plan");
  const turnRef = useRef(0);
  const pitchRef = useRef(0);
  const dollyRef = useRef(1);
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    turn: number;
    pitch: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [measureA, setMeasureA] = useState<MeasurePoint | null>(null);
  const [measureB, setMeasureB] = useState<MeasurePoint | null>(null);
  const { now, sky } = useSkyNow();
  const measureARef = useRef<MeasurePoint | null>(null);
  const measureBRef = useRef<MeasurePoint | null>(null);

  const metric = useAtlas((s) => s.metric);
  const rotation = useAtlas((s) => s.rotation);
  const viewMode = useAtlas((s) => s.viewMode);
  const turn = useAtlas((s) => s.turn);
  const selectedKey = useAtlas((s) => s.selectedKey);
  const hoveredKey = useAtlas((s) => s.hoveredKey);
  const focusToken = useAtlas((s) => s.focusToken);
  const setSelectedKey = useAtlas((s) => s.setSelectedKey);
  const setHoveredKey = useAtlas((s) => s.setHoveredKey);
  const setTurn = useAtlas((s) => s.setTurn);
  const measureMode = useAtlas((s) => s.measureMode);
  const measureModeRef = useRef(measureMode);
  measureModeRef.current = measureMode;
  const clockZone = useAtlas((s) => s.clockZone);
  const viewerPin = useAtlas((s) => s.viewerPin);
  const placingPin = useAtlas((s) => s.placingPin);
  const setViewerPin = useAtlas((s) => s.setViewerPin);
  const setPlacingPin = useAtlas((s) => s.setPlacingPin);
  const setClockOpen = useAtlas((s) => s.setClockOpen);
  const placingPinRef = useRef(placingPin);
  placingPinRef.current = placingPin;

  viewModeRef.current = viewMode;
  if (!dragRef.current) {
    turnRef.current = turn;
  }

  useEffect(() => {
    if (!measureMode) {
      measureARef.current = null;
      measureBRef.current = null;
      setMeasureA(null);
      setMeasureB(null);
    }
  }, [measureMode]);

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

  const applyAttitude = useCallback((animate: boolean) => {
    const rig = rigRef.current;
    const disk = diskRef.current;
    if (!rig || !disk) return;
    const mode = viewModeRef.current;
    const preset = VIEW_PRESETS[mode];
    const pitch = pitchRef.current;
    const tilt =
      mode === "rim" || mode === "pole"
        ? clamp(
            preset.tilt + pitch,
            mode === "pole" ? 64 : 42,
            mode === "pole" ? 84 : 76,
          )
        : preset.tilt;
    const bank =
      mode === "transverse" ? clamp(preset.bank + pitch, 48, 82) : preset.bank;
    const spatial = mode !== "plan";
    const dolly = spatial ? dollyRef.current * preset.scale : 1;
    const motion = animate && !prefersReducedMotion();
    rig.classList.toggle("is-animated", motion);
    disk.classList.toggle("is-animated", motion);
    // Spin/tilt around the pole (disc centre), then boom the camera.
    disk.style.transform = `rotateX(${tilt}deg) rotateY(${bank}deg) rotateZ(${turnRef.current}deg)`;
    disk.style.setProperty("--disk-tilt", `${tilt}deg`);
    disk.style.setProperty("--disk-bank", `${bank}deg`);
    disk.style.setProperty("--disk-turn", `${turnRef.current}deg`);
    const camY =
      preset.camY !== 0 ? `translateY(calc(${preset.camY} * var(--disk-r)))` : "";
    const camZ = preset.camZ !== 0 ? `translateZ(${preset.camZ}px)` : "";
    rig.style.transform = `${camY} ${camZ} scale(${dolly})`.trim();
  }, []);

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
      .filter((event) => {
        if (viewModeRef.current !== "plan") return false;
        if ("button" in event && event.button) return false;
        if (measureModeRef.current || placingPinRef.current) {
          const type = event.type;
          if (type === "mousedown" || type === "touchstart") return false;
        }
        return true;
      })
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        zoomLayerRef.current?.setAttribute(
          "transform",
          event.transform.toString(),
        );
        const el = celestialZoomRef.current;
        if (el) {
          const t = event.transform;
          el.style.transform = `translate(${(t.x / MAP_SIZE) * 100}%, ${(t.y / MAP_SIZE) * 100}%) scale3d(${t.k}, ${t.k}, ${t.k})`;
        }
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
    const board = boardRef.current;
    if (!board) return;

    function syncSize() {
      if (!board) return;
      const size = board.clientWidth;
      const r = size * RIM_RATIO;
      board.style.setProperty("--disk-r", `${r}px`);
      board.style.setProperty(
        "--celestial-h",
        `${r * (BODY_ALTITUDE_GEO / DISC_GEO_MILES)}px`,
      );
      board.style.setProperty(
        "--body-d",
        `${Math.max(2, r * (BODY_DIAMETER_GEO / DISC_GEO_MILES) * BODY_DISPLAY_SCALE)}px`,
      );
      board.style.setProperty(
        "--rim-seg-w",
        `${((2 * Math.PI * r) / DISK_RIM_SEGMENTS) * 1.12}px`,
      );
    }

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(event: WheelEvent) {
      if (viewModeRef.current === "plan") return;
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1 / 1.08 : 1.08;
      dollyRef.current = clamp(dollyRef.current * factor, DOLLY_MIN, DOLLY_MAX);
      applyAttitude(false);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyAttitude]);

  useEffect(() => {
    applyAttitude(true);
  }, [viewMode, turn, applyAttitude]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z) return;
    if (viewMode !== "plan") {
      select(svgEl).call(z.transform, zoomIdentity);
      transformRef.current = zoomIdentity;
      zoomLayerRef.current?.setAttribute("transform", "");
    }
  }, [viewMode]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z || !selectedKey) return;
    const country = GEO_COUNTRIES.find((c) => c.key === selectedKey);
    if (!country) return;

    if (viewModeRef.current === "plan") {
      const bounds = geoPath(projection).bounds(country.feature);
      const [[x0, y0], [x1, y1]] = bounds;
      const w = Math.max(x1 - x0, 8);
      const h = Math.max(y1 - y0, 8);
      const k = Math.min(10, 0.62 / Math.max(w / MAP_SIZE, h / MAP_SIZE));
      const tx = MAP_SIZE / 2 - (k * (x0 + x1)) / 2;
      const ty = MAP_SIZE / 2 - (k * (y0 + y1)) / 2;
      const next = zoomIdentity.translate(tx, ty).scale(k);
      select(svgEl)
        .transition()
        .duration(motionDuration(700))
        .call(z.transform, next);
      return;
    }

    const centroid = geoPath(projection).centroid(country.feature);
    if (!Number.isFinite(centroid[0])) return;
    const deg =
      (Math.atan2(centroid[1] - MAP_SIZE / 2, centroid[0] - MAP_SIZE / 2) *
        180) /
      Math.PI;
    const nextTurn = wrapDeg(nearEdgeAngle(viewModeRef.current) - deg);
    turnRef.current = nextTurn;
    setTurn(nextTurn);
    // focusToken is the trigger; selectedKey identifies the target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedKey(null);
        setTooltip(null);
        setMeasureA(null);
        setMeasureB(null);
        measureARef.current = null;
        measureBRef.current = null;
        setPlacingPin(false);
      }
      if (viewModeRef.current === "plan") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setTurn((t) => t - 12);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setTurn((t) => t + 12);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedKey, setTurn, setPlacingPin]);

  function resetD3() {
    const svgEl = svgRef.current;
    const z = zoomRef.current;
    if (!svgEl || !z) return;
    select(svgEl)
      .transition()
      .duration(motionDuration(480))
      .call(z.transform, zoomIdentity);
  }

  function resetView() {
    pitchRef.current = 0;
    dollyRef.current = 1;
    turnRef.current = 0;
    setTurn(0);
    applyAttitude(true);
    resetD3();
  }

  function zoomBy(factor: number) {
    if (viewModeRef.current !== "plan") {
      dollyRef.current = clamp(dollyRef.current * factor, DOLLY_MIN, DOLLY_MAX);
      applyAttitude(true);
      return;
    }
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
      const rect = viewportRef.current?.getBoundingClientRect();
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
      if (measureModeRef.current || placingPinRef.current) return;
      if (dragRef.current?.moved) return;
      setHoveredKey(country.key);
      showTip(event, country);
    },
    [setHoveredKey, showTip],
  );

  const onMove = useCallback(
    (event: MouseEvent<SVGPathElement>, country: DrawnCountry) => {
      if (measureModeRef.current || placingPinRef.current) return;
      if (dragRef.current?.moved) return;
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
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (measureModeRef.current || placingPinRef.current) return;
      setSelectedKey(active ? null : key);
    },
    [setSelectedKey],
  );

  function clientToDisc(
    event: { clientX: number; clientY: number },
  ): [number, number] | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    const sx = ((event.clientX - rect.left) / rect.width) * MAP_SIZE;
    const sy = ((event.clientY - rect.top) / rect.height) * MAP_SIZE;
    const [x, y] = transformRef.current.invert([sx, sy]);
    const dx = x - MAP_SIZE / 2;
    const dy = y - MAP_SIZE / 2;
    if (Math.hypot(dx, dy) > MAP_RADIUS + 4) return null;
    return [x, y];
  }

  function placePin(event: { clientX: number; clientY: number }) {
    if (!placingPinRef.current) return false;
    if (viewModeRef.current !== "plan") return false;
    const xy = clientToDisc(event);
    if (!xy) return false;
    const ll = invertLonLat(projection, xy[0], xy[1]);
    if (!ll) return false;
    setViewerPin({ lat: ll.lat, lon: ll.lon, label: "You" });
    setPlacingPin(false);
    setClockOpen(true);
    return true;
  }

  function placeMeasure(event: { clientX: number; clientY: number }) {
    if (!measureModeRef.current) return false;
    if (viewModeRef.current !== "plan") return false;
    const xy = clientToDisc(event);
    if (!xy) return false;
    const ll = invertLonLat(projection, xy[0], xy[1]);
    if (!ll) return false;
    const point: MeasurePoint = {
      x: xy[0],
      y: xy[1],
      lon: ll.lon,
      lat: ll.lat,
    };
    const hasA = measureARef.current;
    const hasB = measureBRef.current;
    if (!hasA || hasB) {
      measureARef.current = point;
      measureBRef.current = null;
      setMeasureA(point);
      setMeasureB(null);
    } else {
      measureBRef.current = point;
      setMeasureB(point);
    }
    return true;
  }

  function onStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (viewModeRef.current === "plan") return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest(".map-space")) return;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      turn: turnRef.current,
      pitch: pitchRef.current,
      moved: false,
    };
  }

  function onStagePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      suppressClickRef.current = true;
      setTooltip(null);
      setHoveredKey(null);
      viewportRef.current?.setPointerCapture(event.pointerId);
    }
    turnRef.current = wrapDeg(drag.turn + dx * 0.42);
    pitchRef.current = clamp(drag.pitch - dy * 0.12, -18, 18);
    applyAttitude(false);
  }

  function onStagePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) {
      setTurn(turnRef.current);
    }
    dragRef.current = null;
  }

  const pole = projection([0, 90]);
  const def = METRICS[metric];
  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const spatial = viewMode !== "plan";
  const drawnA = measureA ? projectMeasure(projection, measureA) : null;
  const drawnB = measureB ? projectMeasure(projection, measureB) : null;
  const drawnMeasure =
    drawnA && drawnB ? discMeasure(drawnA, drawnB) : null;
  const timeZone = clockZone === "central" ? CENTRAL_TZ : viewerTimeZone();
  const civilMeridian = now ? zoneMeridian(now, timeZone) : 0;
  const zoneAbbrev = now ? formatZoneAbbrev(now, timeZone) : "";
  const youPt = viewerPin
    ? projection([viewerPin.lon, viewerPin.lat])
    : null;
  const sunNadir = sky ? projection([sky.sun.lon, sky.sun.lat]) : null;

  return (
    <div
      ref={viewportRef}
      className="map-viewport"
      data-view={viewMode}
      data-measure={measureMode ? "true" : undefined}
      data-place={placingPin ? "true" : undefined}
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
    >
      <div className="map-ground-shadow" />
      <div className="map-space">
        <div ref={boardRef} className="map-board">
          <div ref={rigRef} className="map-rig">
            <div ref={diskRef} className="map-disk">
              <div className="map-disk-back" />
              <DiskRim />
              <div className="map-disk-lip" />
              <div className="map-disk-face">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
                  className={
                    spatial
                      ? "h-full w-full touch-none"
                      : measureMode || placingPin
                        ? "h-full w-full cursor-crosshair touch-none"
                        : "h-full w-full cursor-grab touch-none active:cursor-grabbing"
                  }
                  role="img"
                  aria-label={`Gleason polar map colored by ${def.label}, ${VIEW_PRESETS[viewMode].label} view`}
                  onDoubleClick={resetView}
                  onClickCapture={(e) => {
                    if (suppressClickRef.current) return;
                    if (placePin(e) || placeMeasure(e)) {
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    if (measureMode || placingPin) return;
                    if (e.target === e.currentTarget) setSelectedKey(null);
                  }}
                >
                  <rect
                    width={MAP_SIZE}
                    height={MAP_SIZE}
                    fill="var(--color-background)"
                    onClick={() => {
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      setSelectedKey(null);
                    }}
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
                      onClick={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        setSelectedKey(null);
                      }}
                    />
                    <path
                      d={graticule}
                      className="map-graticule"
                      pointerEvents="none"
                    />
                    <path
                      d={equator}
                      className="map-equator"
                      pointerEvents="none"
                    />
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
                    <TimeRing projection={projection} />
                    {sky && (
                      <CelestialBodies
                        projection={projection}
                        sky={sky}
                        zoneMeridian={civilMeridian}
                        zoneAbbrev={zoneAbbrev}
                      />
                    )}
                    {youPt && sunNadir && (
                      <line
                        x1={youPt[0]}
                        y1={youPt[1]}
                        x2={sunNadir[0]}
                        y2={sunNadir[1]}
                        className="map-you-ray"
                      />
                    )}
                    {youPt && (
                      <g pointerEvents="none">
                        <circle
                          cx={youPt[0]}
                          cy={youPt[1]}
                          r={8}
                          className="map-you-ring"
                        />
                        <circle
                          cx={youPt[0]}
                          cy={youPt[1]}
                          r={3.4}
                          className="map-you-dot"
                        />
                        <text
                          x={youPt[0]}
                          y={youPt[1] - 12}
                          className="map-you-label"
                          textAnchor="middle"
                        >
                          You
                        </text>
                      </g>
                    )}
                    {measureMode && <GleasonMarks projection={projection} />}
                    {drawnA && (
                      <circle
                        cx={drawnA.x}
                        cy={drawnA.y}
                        r={5}
                        className="map-measure-point"
                        pointerEvents="none"
                      />
                    )}
                    {drawnB && (
                      <circle
                        cx={drawnB.x}
                        cy={drawnB.y}
                        r={5}
                        className="map-measure-point"
                        pointerEvents="none"
                      />
                    )}
                    {drawnA && drawnB && (
                      <line
                        x1={drawnA.x}
                        y1={drawnA.y}
                        x2={drawnB.x}
                        y2={drawnB.y}
                        className="map-measure-line"
                        pointerEvents="none"
                      />
                    )}
                    {drawnA && drawnB && drawnMeasure && (
                      <text
                        x={(drawnA.x + drawnB.x) / 2}
                        y={(drawnA.y + drawnB.y) / 2 - 10}
                        className="map-measure-label"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {formatCount(drawnMeasure.geo)} geo. mi
                      </text>
                    )}
                    {pole && !measureMode && (
                      <circle
                        cx={pole[0]}
                        cy={pole[1]}
                        r={3.2}
                        fill="var(--color-foreground)"
                        pointerEvents="none"
                      />
                    )}
                    {!measureMode &&
                      latLabels.map((l) => (
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
                    {!measureMode &&
                      rimMarks.map((m, i) => (
                      <g key={i} pointerEvents="none">
                        <line
                          x1={m.x1}
                          y1={m.y1}
                          x2={m.x2}
                          y2={m.y2}
                          className={
                            m.major ? "rim-tick rim-tick-major" : "rim-tick"
                          }
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
              </div>
              <div className="celestial-space">
                <div
                  ref={celestialZoomRef}
                  className="celestial-zoom"
                  style={{
                    transform: `translate(${(transformRef.current.x / MAP_SIZE) * 100}%, ${(transformRef.current.y / MAP_SIZE) * 100}%) scale3d(${transformRef.current.k}, ${transformRef.current.k}, ${transformRef.current.k})`,
                  }}
                >
                  {sky && (
                    <CelestialOrbs projection={projection} sky={sky} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ViewSwitcher />
      {measureMode && (
        <DistanceHud
          a={drawnA}
          b={drawnB}
          onClear={() => {
            measureARef.current = null;
            measureBRef.current = null;
            setMeasureA(null);
            setMeasureB(null);
          }}
        />
      )}
      {!measureMode && <MapLegend scale={scale} metric={metric} />}
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
