export interface ShippingSettings {
  flatPence: number;
  /** Subtotal at or above which shipping is free; null = never waived. */
  freeThresholdPence: number | null;
}

/** Pure so the basket (client) can preview the exact figure checkout (server) will charge. */
export function calculateShippingPence(subtotalPence: number, settings: ShippingSettings): number {
  if (settings.freeThresholdPence !== null && subtotalPence >= settings.freeThresholdPence) {
    return 0;
  }
  return settings.flatPence;
}
