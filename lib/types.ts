export type UserType = "mesta" | "ue"

export const REGISTRATION_TYPES = {
  ARBEIDSDOK: "arbeidsdok",
  AVVIK_RUH: "avvik_ruh_forbedringer",
  VINTERARBEID: "vinterarbeid",
  MASKIN: "maskinregistrering",
  FRIKSJON: "friksjon",
  INNKJOP: "innkjop",
  VOICE_MEMO: "voice_memo",
  UTBEDRING: "utbedring",
} as const

export type RegistrationType = (typeof REGISTRATION_TYPES)[keyof typeof REGISTRATION_TYPES]

export type VoiceMemoType = "loggbok" | "notat"

export interface VoiceMemoMetadata {
  type: VoiceMemoType
  userId: string
  contractArea: string
  contractNummer?: number
  timestamp: string
  transcript?: string
  vakttlf?: boolean
  ringer?: string
  hendelse?: string
  tiltak?: string
}

export interface OfflineVoiceMemo {
  audioBlob: string // base64 encoded
  metadata: VoiceMemoMetadata
  savedAt: number
}

export const OPERATIONAL_STATUS_CONFIG = {
  EXPIRY_HOURS: 2,
  CHECK_INTERVAL_MS: 30000,
} as const

export interface Profile {
  id: string
  full_name: string
  email: string
  company: string
  user_type: UserType
  contract_area: string | null
  contract_area_id: string | null
  contract_nummer: number | null
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  user_id: string | null
  registered_by_name: string
  registration_type: RegistrationType
  data: Record<string, unknown>
  created_at: string
}

export interface AppLink {
  id: string
  name: string
  description: string
  icon: string
  playStoreUrl: string
  appStoreUrl?: string
  androidPackage?: string
  iosUrl?: string
  webUrl?: string
  mestaOnly?: boolean
  contractTypes?: ("riksveg" | "fylkeskommune")[]
  userTypes?: ("mesta" | "ue")[]
}

export interface ContractArea {
  id: string
  name: string
  region: string
}

export interface ContractBoundary {
  id: string
  name: string
  nummer: number
  centerLat: number
  centerLon: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface Location {
  name: string
  lat: number
  lon: number
  type: "city" | "town" | "village"
}

export interface WeatherData {
  location: string
  lat: number
  lon: number
  temperature: number
  precipitation: number
  windSpeed: number
  windDirection: number
  symbol: string
  updatedAt: string
}

export interface AvalancheWarning {
  regionId: number
  regionName: string
  dangerLevel: number
  dangerLevelName: string
  validFrom: string
  validTo: string
  mainText: string
}

export interface RoadCondition {
  location: string
  condition: string
  friction?: number
  lastUpdated: string
}
