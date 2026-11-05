/**
 * The studio's ▲/▼ percentages compare the latest bucket with the one before
 * it (for "1D": this hour vs last hour), which reads as nonsense on a card.
 * This replaces them with a real period-over-period change: the total for the
 * selected period vs the total for the same-length period right before it.
 */
const DAY = 24 * 60 * 60 * 1000;

function windowFor(period: string, params: URLSearchParams, now: Date): { start: Date; end: Date } | null {
	switch (period) {
		case "1D": return { start: new Date(now.getTime() - DAY), end: now };
		case "1W": return { start: new Date(now.getTime() - 7 * DAY), end: now };
		case "1M": return { start: new Date(now.getTime() - 30 * DAY), end: now };
		case "3M":
		case "6M":
		case "1Y": {
			const months = period === "3M" ? 3 : period === "6M" ? 6 : 12;
			return { start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1), end: now };
		}
		case "Custom": {
			const from = params.get("from");
			const to = params.get("to");
			if (!from) return null;
			const start = new Date(from);
			const end = to ? new Date(to) : now;
			return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start ? null : { start, end };
		}
		default: return null; // "ALL" has no earlier period to compare with
	}
}

export function changePercent(current: number, previous: number): number {
	if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10;
	return current > 0 ? 100 : 0;
}

/** `fetchTotal(type, from, to)` returns the studio's own total for a custom range. */
export async function fixAnalytics(
	url: URL,
	body: { total?: number; percentageChange?: number; previousTotal?: number; type?: string },
	fetchTotal: (type: string, from: Date, to: Date) => Promise<number>,
) {
	const period = url.searchParams.get("period") ?? "1D";
	const type = url.searchParams.get("type") ?? body.type;
	const w = windowFor(period, url.searchParams, new Date());
	if (!w || !type) return { ...body, percentageChange: 0 };
	const span = w.end.getTime() - w.start.getTime();
	const [current, previous] = await Promise.all([
		fetchTotal(type, w.start, w.end),
		fetchTotal(type, new Date(w.start.getTime() - span), new Date(w.start.getTime() - 1)),
	]);
	return { ...body, previousTotal: previous, percentageChange: changePercent(current, previous) };
}
