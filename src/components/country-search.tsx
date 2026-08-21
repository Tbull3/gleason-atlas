import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/data/countries";
import { useAtlas } from "@/lib/atlas-store";

export function CountrySearch() {
  const query = useAtlas((s) => s.searchQuery);
  const setSearchQuery = useAtlas((s) => s.setSearchQuery);
  const focusCountry = useAtlas((s) => s.focusCountry);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  return (
    <div ref={boxRef} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        placeholder="Search countries"
        aria-label="Search countries"
        className="h-10 bg-surface-2 pl-8 md:h-9"
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            focusCountry(results[0].key);
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && results.length > 0 && (
        <ul className="absolute top-[calc(100%+4px)] right-0 left-0 z-30 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-sm">
          {results.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  focusCountry(c.key);
                  setOpen(false);
                }}
              >
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
