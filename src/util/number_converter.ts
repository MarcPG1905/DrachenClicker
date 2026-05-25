// +++ Start ChatGPT +++
const TIERS = [
    [1, ""],
    [1e3, " Tausend"], // Thousand
    [1e6, " Millionen"], // Million
    [1e9, " Milliarden"], // Billion
    [1e12, " Billionen"], // Trillion
    [1e15, " Billiarden"], // Quadrillion
    [1e18, " Trillionen"], // Quintillion
    [1e21, " Trilliarden"], // Sextillion
    [1e24, " Quadrillionen"], // Septillion
    [1e27, " Quadrilliarden"], // Octillion
    [1e30, " Quintillionen"], // Nonillion
    [1e33, " Quintilliarden"], // Decillion
    [1e36, " Sextillionen"], // Undecillion
    [1e39, " Sextilliarden"], // Duodecillion
    [1e42, " Septillionen"], // Tredecillion
    [1e45, " Septilliarden"], // Quattuordecillion
    [1e48, " Oktillionen"], // Quindecillion
    [1e51, " Oktilliarden"], // Sexdecillion
] as const

export function formatNumber(value: number, noDecimals: boolean = false): string {
    if (value < 1000) {
        return noDecimals ? value.toFixed(0) : value.toFixed(1)
    }

    let tier = (Math.log10(value) / 3) | 0
    const tierData = TIERS[tier]
    let scale = tierData[0]
    let suffix = tierData[1]

    let scaled = value / scale

    // smooth rollover: 999.95K -> 1.00M
    if (scaled >= 999.95 && tier < TIERS.length - 1) {
        tier++
        const next = TIERS[tier]
        scale = next[0]
        suffix = next[1]
        scaled = value / scale
    }

    return scaled.toFixed(scaled >= 100 ? 1 : 2) + suffix
}
// --- Ende ChatGPT ---

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
