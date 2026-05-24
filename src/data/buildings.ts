import type { PurchasableObject } from "./object"

export type State = Record<string, number>

export type Building = PurchasableObject & {
    baseWps: number,
    uiId: number,
}

export const dataset: Building[] = [
    {
        id: "monster_energy",
        name: "Monster Energy",
        baseCost: 15,
        baseWps: 0.1,
        uiId: 0,
    },
    {
        id: "ofen",
        name: "Ofen",
        baseCost: 100,
        baseWps: 1,
        uiId: 1,
    },
    {
        id: "ford_blue",
        name: "Ford Blu",
        baseCost: 500,
        baseWps: 4,
        uiId: 2,
    },
    {
        id: "loschzwerg",
        name: "Löschzwerg",
        baseCost: 8_000,
        baseWps: 32,
        uiId: 3,
    },
    {
        id: "forza_download",
        name: "Forza Download",
        baseCost: 125_000,
        baseWps: 220,
        uiId: 4,
    },
    {
        id: "bauzaun",
        name: "Bauzaun (vor de Schanze)",
        baseCost: 1_000_000,
        baseWps: 1200,
        uiId: 5,
    },
    {
        id: "wasserbein",
        name: "Wasserbein",
        baseCost: 22_000_000,
        baseWps: 8000,
        uiId: 6,
    },
]

const map = new Map<string, Building>(
  dataset.map(u => [u.id, u])
);

export function get(id: string): Building | undefined {
  return map.get(id);
}
