export function spawnChance(
    t: number,
    tMin: number,
    tMax: number,
    factor: number = 3,
): number {
    return ((t - tMin) / (tMax - tMin)) ** factor
}

export function boolByChance(p: number) {
    return Math.random() < p
}
