export interface Narrator {
  id: string | number
  name: string
  grade?: string
  birth_date_place?: string
  death_date_place?: string
  teachers?: string
  students?: string
  area_of_interest?: string
  degree?: number
  pagerank?: number
  in_degree?: number
  out_degree?: number
  betweenness?: number
  group?: number
}

export interface Link {
  source: string | number
  target: string | number
  weight?: number
}

export interface Hadith {
  id: string | number
  hadith_id: string | number
  source: string
  chapter?: string
  hadith_no?: string
  text_en?: string
  text_ar?: string
  chain: (string | number)[]
  narrator_names?: string[]
}

export interface NetworkData {
  nodes: Narrator[]
  links: Link[]
  hadiths: Hadith[]
}

export interface ForceConfig {
  charge: number
  linkDistance: number
  centerStrength: number
  collisionRadius: number
}
