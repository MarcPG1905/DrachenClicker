import type { IdValueMap, PurchasableObject } from "./object"

export type State = Record<string, boolean>

export type Upgrade = PurchasableObject & {
  icon: number,

  // Upgrade Effects
  wpsEffect?: (prev: number) => number,
  clickFactorEffect?: (prev: number) => number,
  buildingMultipliers?: IdValueMap,
}

export const dataset: Upgrade[] = [
  {
    id: "monster_energy_mult1",
    name: "Mehr Koffein",
    baseCost: 400,
    icon: 0,
    buildingMultipliers: {
      "monster_energy": () => 2.0,
    },
  },
  {
    id: "click_mult1",
    name: "Gaming Maus",
    baseCost: 750,
    icon: 2,
    clickFactorEffect: (prev) => prev += 0.10 // +10%
  },
  {
    id: "ofen_mult1",
    name: "Größere Flamme",
    baseCost: 1250,
    icon: 1,
    buildingMultipliers: {
      "ofen": () => 2.0,
    },
  },
]

const map = new Map<string, Upgrade>(
  dataset.map(u => [u.id, u])
);

export function get(id: string): Upgrade | undefined {
  return map.get(id);
}
