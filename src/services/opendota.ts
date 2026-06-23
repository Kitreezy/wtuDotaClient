import { cached } from "./cache"

const BASE = "https://api.opendota.com/api"

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}/${path}`)
  if (!r.ok) throw new Error(`OpenDota ${path}: ${r.status}`)
  return r.json()
}

// Long TTL: 30 min for constants, 5 min for player/match data
const LONG = 30 * 60 * 1000

export const opendota = {
  heroStats:      ()         => cached("heroStats",      () => get<any[]>("heroStats"), LONG),
  heroes:         ()         => cached("heroes",         () => get<any[]>("heroes"), LONG),
  proPlayers:     ()         => cached("proPlayers",     () => get<any[]>("proPlayers"), LONG),
  abilityIds:     ()         => cached("abilityIds",     () => get<any>("constants/abilities"), LONG),
  heroAbilities:  ()         => cached("heroAbilities",  () => get<any>("constants/hero_abilities"), LONG),
  itemConstants:  ()         => cached("itemConstants",  () => get<any>("constants/items"), LONG),

  playerMatches:  (id: number) => cached(`playerMatches:${id}`,  () => get<any[]>(`players/${id}/matches?limit=20`)),
  playerHeroes:   (id: number) => cached(`playerHeroes:${id}`,   () => get<any[]>(`players/${id}/heroes`)),
  player:         (id: number) => cached(`player:${id}`,         () => get<any>(`players/${id}`)),
  match:          (id: number) => cached(`match:${id}`,          () => get<any>(`matches/${id}`), LONG),
  heroMatchups:     (id: number) => cached(`heroMatchups:${id}`,     () => get<any[]>(`heroes/${id}/matchups`), LONG),
  heroMatches:      (id: number) => cached(`heroMatches:${id}`,      () => get<any[]>(`heroes/${id}/matches?limit=20`)),
  heroItemPopularity:(id: number) => cached(`heroItems:${id}`,       () => get<any>(`heroes/${id}/itemPopularity`), LONG),
  laneRoles:        ()            => cached("laneRoles",              () => get<any[]>("scenarios/laneRoles"), LONG),
}
