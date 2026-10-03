/**
 * Carriers staff can pick when dispatching. trackingUrl templates are the carrier's public
 * tracking page with the number filled in — carriers change these occasionally, so check each
 * with a real tracking number and update here if one stops working. Staff can also paste an exact
 * tracking URL per order, which always wins over the template.
 */

export interface Carrier {
  id: string;
  name: string;
  trackingUrl: ((trackingNumber: string) => string) | null;
}

export const CARRIERS: Carrier[] = [
  {
    id: "royal-mail",
    name: "Royal Mail",
    trackingUrl: (n) =>
      `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n)}`,
  },
  {
    id: "parcelforce",
    name: "Parcelforce",
    trackingUrl: (n) =>
      `https://www.parcelforce.com/track-trace?trackNumber=${encodeURIComponent(n)}`,
  },
  {
    id: "evri",
    name: "Evri",
    trackingUrl: (n) =>
      `https://www.evri.com/track/parcel/${encodeURIComponent(n)}/details`,
  },
  {
    id: "dpd",
    name: "DPD",
    trackingUrl: (n) => `https://track.dpd.co.uk/parcels/${encodeURIComponent(n)}`,
  },
  { id: "other", name: "Other", trackingUrl: null },
];

export function findCarrier(id: string | null | undefined): Carrier | null {
  return CARRIERS.find((carrier) => carrier.id === id) ?? null;
}
