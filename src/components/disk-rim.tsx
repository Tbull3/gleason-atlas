import { DISK_RIM_SEGMENTS } from "@/lib/view-modes";

export function DiskRim() {
  return (
    <div className="disk-rim" aria-hidden="true">
      {Array.from({ length: DISK_RIM_SEGMENTS }, (_, i) => (
        <span
          key={i}
          className="disk-rim-seg"
          style={{
            transform: `rotateZ(${(i / DISK_RIM_SEGMENTS) * 360}deg) translateY(calc(-1 * var(--disk-r))) rotateX(90deg)`,
          }}
        />
      ))}
    </div>
  );
}
