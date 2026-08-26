import { useAtlas } from "@/lib/atlas-store";

export function useMarkPlace() {
  const viewerPin = useAtlas((s) => s.viewerPin);
  const placingPin = useAtlas((s) => s.placingPin);
  const setViewerPin = useAtlas((s) => s.setViewerPin);
  const setPlacingPin = useAtlas((s) => s.setPlacingPin);
  const setViewMode = useAtlas((s) => s.setViewMode);
  const setMeasureMode = useAtlas((s) => s.setMeasureMode);
  const setClockOpen = useAtlas((s) => s.setClockOpen);

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
    if (typeof navigator === "undefined" || !navigator.geolocation) {
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

  return { markPlace, viewerPin, placingPin };
}
