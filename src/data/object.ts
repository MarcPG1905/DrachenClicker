import { costGrowthFactor } from "./constants"

export type GameObject = {
    id: string,
    name: string,
    description?: string,
}

export type PurchasableObject = GameObject & {
    baseCost: number,
}

export type IdValueMap = Record<string, () => number>;

export function calculateCost(object: PurchasableObject, prebought: number, amount: number = 1) {
    return Math.ceil(object.baseCost * Math.pow(costGrowthFactor, prebought) * ((Math.pow(costGrowthFactor, amount) - 1) / (costGrowthFactor - 1)))
}
