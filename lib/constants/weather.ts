export const FALLBACK_LOCATIONS = [
  { name: "Neiden", lat: 69.7425, lon: 29.2367, type: "border" as const },
  { name: "Tana Bru", lat: 70.1944, lon: 28.1625, type: "town" as const },
  { name: "Karasjok", lat: 69.4727, lon: 25.5065, type: "town" as const },
  { name: "Levajok", lat: 70.1333, lon: 27.8667, type: "village" as const },
  { name: "Valjok", lat: 69.8833, lon: 27.0167, type: "village" as const },
  { name: "Sirma", lat: 70.0833, lon: 27.4667, type: "village" as const },
  { name: "Varangerbotn", lat: 70.0175, lon: 28.8333, type: "coastal" as const },
  { name: "Vestre Jakobselv", lat: 70.0833, lon: 29.5167, type: "coastal" as const },
  { name: "Vadsø", lat: 70.0744, lon: 29.7488, type: "town" as const },
  { name: "Kiberg", lat: 70.2667, lon: 30.95, type: "coastal" as const },
  { name: "Vardø", lat: 70.3706, lon: 31.1089, type: "coastal" as const },
  { name: "Bugøyfjord", lat: 69.9667, lon: 29.6667, type: "coastal" as const },
  { name: "Høybuktmoen", lat: 69.7167, lon: 29.9, type: "town" as const },
  { name: "Kirkenes", lat: 69.7267, lon: 30.0425, type: "town" as const },
  { name: "Storskog", lat: 69.6508, lon: 30.0872, type: "border" as const },
] as const

export const CONDITION_TEXT = {
  good: "Gode forhold",
  caution: "Forsiktig",
  danger: "Farlig",
} as const

export const CONDITION_COLOR = {
  good: "bg-green-500/20 border-green-500 text-green-400",
  caution: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
  danger: "bg-red-500/20 border-red-500 text-red-400",
} as const

export const TYPE_TEXT = {
  coastal: "Kyst",
  border: "Grense",
  village: "Bygd",
  weather_station: "Værstasjon",
  city: "By",
  poi: "Punkt",
  town: "By",
} as const
