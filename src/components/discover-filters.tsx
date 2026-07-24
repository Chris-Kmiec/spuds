"use client";

import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { EVENT_TYPES } from "@/lib/constants";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DiscoverFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) setParam("q", q.trim() || null);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeType = params.get("type");

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-soil-800/40" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search parties, games…"
          className="pl-11"
        />
      </div>

      <div className="scroll-rail flex gap-2 overflow-x-auto pb-1">
        {EVENT_TYPES.map((t) => (
          <Chip
            key={t.value}
            selected={activeType === t.value}
            onClick={() =>
              setParam("type", activeType === t.value ? null : t.value)
            }
            className="shrink-0"
          >
            {t.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
