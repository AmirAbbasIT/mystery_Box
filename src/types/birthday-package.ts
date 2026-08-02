export type BirthdayAudience = "kids" | "adult-party";

export interface BirthdayPackage {
  id: string;
  slug: string;
  audience: BirthdayAudience;
  name: string;
  description: string;
  priceFrom: number;
  includes: string[];
  ageRange?: string;
  themeIds: string[];
  image: string;
}
