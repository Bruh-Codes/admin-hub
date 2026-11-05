import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { BarChart3, ChevronDown } from "../PixelIcons";

interface EventItem {
  id: string;
  type: string;
  timestamp: string;
  status?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const EVENT_RANGE_OPTIONS = [
  { label: "Last 24h", hours: 24 },
  { label: "Last 2 days", hours: 48 },
  { label: "Last 7 days", hours: 168 },
  { label: "Last 30 days", hours: 720 },
  { label: "All", hours: 0 },
] as const;

function formatEventTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return format(new Date(ts), "MMM dd");
}

export function EventsWidget() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsNotReady, setEventsNotReady] = useState(false);
  const [selectedHours, setSelectedHours] = useState(24);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sinceParam =
          selectedHours > 0
            ? new Date(Date.now() - selectedHours * 60 * 60 * 1000).toISOString()
            : undefined;
        const listUrl = sinceParam
          ? `/api/events?limit=50&sort=desc&since=${encodeURIComponent(sinceParam)}`
          : "/api/events?limit=50&sort=desc";
        const [listRes, countRes] = await Promise.all([fetch(listUrl), fetch("/api/events/count")]);
        if (cancelled) return;
        const listData = await listRes.json().catch(() => ({}));
        const countData = await countRes.json().catch(() => ({}));
        if (cancelled) return;
        const notReady =
          listData?.error === "Events not ready" || listData?.ready === false || !listRes.ok;
        setEventsNotReady(notReady);
        if (notReady) {
          setEvents([]);
          setTotal(0);
        } else {
          if (listRes.ok && Array.isArray(listData.events)) {
            setEvents(listData.events);
          }
          if (countRes.ok) {
            setTotal(countData.total ?? countData.count ?? null);
          }
        }
      } catch (_e) {
        if (!cancelled) {
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedHours]);

  const activeLabel =
    EVENT_RANGE_OPTIONS.find((o) => o.hours === selectedHours)?.label ?? "Last 24h";

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/60" />
          <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
            Events
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {total != null && (
            <span className="text-[10px] font-mono text-gray-600">
              {total.toLocaleString()} total
            </span>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase"
            >
              <span className="truncate max-w-[90px]">{activeLabel}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
            {showDropdown && (
              <div className="absolute top-full mt-1 right-0 z-50 w-[140px] bg-black border border-white/10 shadow-2xl">
                {EVENT_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => {
                      setSelectedHours(opt.hours);
                      setShowDropdown(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-[11px] font-mono border-b border-white/5 transition-colors ${
                      selectedHours === opt.hours
                        ? "text-white bg-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600 text-center px-2">
            {eventsNotReady
              ? "Events not configured. Enable in studio config to use the events table."
              : "No events in this period"}
          </p>
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Type
                </th>
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Status
                </th>
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 hover:bg-white/[3%] transition-colors group"
                >
                  <td className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[120px] transition-colors font-mono">
                    {e.type}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {e.status ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border rounded-sm uppercase font-mono ${
                          e.status === "success"
                            ? "text-green-400/80 border-green-400/20"
                            : e.status === "error"
                              ? "text-red-400/80 border-red-400/20"
                              : "text-gray-500 border-white/10"
                        }`}
                      >
                        {e.status}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {e.timestamp ? formatEventTime(e.timestamp) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
