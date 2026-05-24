import type { PurchasableObject } from "./object"

export type State = Record<string, boolean>

export type Upgrade = PurchasableObject & {
  icon: number,

  // Upgrade Effects
  wpsEffect?: (prev: number) => number,
  clickFactorEffect?: (prev: number) => number,
}

export const dataset: Upgrade[] = [
]

const map = new Map<string, Upgrade>(
  dataset.map(u => [u.id, u])
);

export function get(id: string): Upgrade | undefined {
  return map.get(id);
}
