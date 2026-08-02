export interface SeasonalCollection {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** ISO date strings. */
  startsAt: string;
  endsAt: string;
  heroImage: string;
  productIds: string[];
}
