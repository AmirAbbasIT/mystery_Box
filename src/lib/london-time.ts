/**
 * Calendar dates in UK time. Admin forms use plain date inputs ("starts on 1 Oct"), which must mean
 * midnight in London — GMT or BST — not midnight on the server (UTC on Vercel).
 */

const TIME_ZONE = "Europe/London";
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function londonOffsetMs(instant: Date): number {
  const label =
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, timeZoneName: "shortOffset" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(label);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  return (hours * 60 + Math.sign(hours) * minutes) * 60_000;
}

/** "2026-10-31" -> the instant it becomes 31 Oct in London. Null if not a real YYYY-MM-DD date. */
export function londonMidnight(date: string): Date | null {
  const match = DATE_PATTERN.exec(date);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utcMidnight = Date.UTC(year, month - 1, day);
  const check = new Date(utcMidnight);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;

  // Two passes so a date on a clock-change day picks up that day's own offset.
  const firstGuess = utcMidnight - londonOffsetMs(new Date(utcMidnight));
  return new Date(utcMidnight - londonOffsetMs(new Date(firstGuess)));
}

/** The London calendar date of an instant, as YYYY-MM-DD. */
export function toLondonDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function addDays(date: string, days: number): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) return date;
  const shifted = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  );
  return shifted.toISOString().slice(0, 10);
}
