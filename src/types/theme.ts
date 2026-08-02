export interface Theme {
  id: string;
  slug: string;
  name: string;
  /** Hex swatch used for filter chips and theme accents. */
  colorSwatch: string;
  description: string;
}
