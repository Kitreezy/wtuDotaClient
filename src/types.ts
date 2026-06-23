export interface Hero {
  id: number
  localized_name: string
  primary_attr: "str" | "agi" | "int" | "all"
  attack_type: "Melee" | "Ranged"
  roles: string[]
  img: string
  icon: string
}

export interface HeroStat extends Hero {
  pro_win: number
  pro_pick: number
  hero_id: number
  "1_win": number; "1_pick": number
  "2_win": number; "2_pick": number
  "3_win": number; "3_pick": number
  "4_win": number; "4_pick": number
  "5_win": number; "5_pick": number
  "6_win": number; "6_pick": number
  "7_win": number; "7_pick": number
  "8_win": number; "8_pick": number
}

export interface ProPlayer {
  account_id: number
  name: string
  team_name?: string
  country_code?: string
  avatar?: string
  is_pro?: boolean
}

export interface Match {
  match_id: number
  hero_id: number
  player_slot: number
  radiant_win: boolean
  duration: number
  game_mode: number
  kills: number
  deaths: number
  assists: number
  start_time: number
}

export interface MetaShiftStat {
  heroId: number
  currentWR: number
  previousWR: number
  currentPicks: number
  delta: number
}
