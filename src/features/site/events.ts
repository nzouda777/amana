/** Sépare les événements à venir (triés du plus proche au plus lointain) des passés. */
export function splitEvents<T extends { startsAt: string; endsAt?: string | null }>(
  events: readonly T[],
  now: number = Date.now(),
): { upcoming: T[]; past: T[] } {
  const end = (event: T) => Date.parse(event.endsAt ?? event.startsAt)
  return {
    upcoming: events
      .filter((event) => end(event) >= now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    past: events.filter((event) => end(event) < now),
  }
}
