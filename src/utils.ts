export function heroImgUrl(internalName: string): string {
  const slug = internalName.replace("npc_dota_hero_", "")
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`
}

export function heroIconUrl(internalName: string): string {
  const slug = internalName.replace("npc_dota_hero_", "")
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${slug}.png`
}

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export function formatWR(wins: number, picks: number): string {
  return picks > 0 ? (wins / picks * 100).toFixed(1) : "—"
}

export function wrColor(wr: number): string {
  if (wr >= 54) return "#1FE3C2"
  if (wr >= 51) return "#FFB627"
  if (wr <= 47) return "#FF4E6A"
  return "#8B90A0"
}
