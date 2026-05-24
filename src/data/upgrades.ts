import type { PurchasableObject } from "./object"

export type State = Record<string, boolean>

export type Upgrade = PurchasableObject & {
}

export const dataset: Upgrade[] = [
]

const map = new Map<string, Upgrade>(
  dataset.map(u => [u.id, u])
);

export function get(id: string): Upgrade | undefined {
  return map.get(id);
}
