// Driftskontraktdata hentet fra Statens vegvesen (september 2025)
// Kilde: https://www.vegvesen.no/fag/veg-og-gate/konkurranser-og-kontraktsdokumenter/driftskontrakter/lopande-driftskontraktar/

export interface ContractArea {
  id: string
  name: string
  nummer: number
  type: "riksveg" | "felleskontrakt" | "elektro" | "fylkeskommune" | "kommune"
  region: string
  entreprenor: string
  periode: string
}

// Riksvegkontrakter fra Statens vegvesen (28 stykk + 2 utviklingskontrakter)
export const riksvegkontrakter: ContractArea[] = [
  {
    id: "rv-9101",
    nummer: 9101,
    name: "9101 Drammen",
    type: "riksveg",
    region: "Viken",
    entreprenor: "VAKTMESTERKOMPANIET AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9102",
    nummer: 9102,
    name: "9102 Hallingdal og Valdres",
    type: "riksveg",
    region: "Viken/Innlandet",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9103",
    nummer: 9103,
    name: "9103 Østfold–Follo",
    type: "riksveg",
    region: "Viken",
    entreprenor: "MESTA AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9104",
    nummer: 9104,
    name: "9104 Oslo–Gardermoen",
    type: "riksveg",
    region: "Oslo/Akershus",
    entreprenor: "VAKTMESTERKOMPANIET AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9106",
    nummer: 9106,
    name: "9106 Gjøvik–Romerike",
    type: "riksveg",
    region: "Innlandet/Akershus",
    entreprenor: "MESTA AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9107",
    nummer: 9107,
    name: "9107 Gudbrandsdalen",
    type: "riksveg",
    region: "Innlandet",
    entreprenor: "STIAN BRENDEN MASKINSERVICE AS",
    periode: "2025–2030",
  },
  {
    id: "rv-9108",
    nummer: 9108,
    name: "9108 Hedmark",
    type: "riksveg",
    region: "Innlandet",
    entreprenor: "MESTA AS",
    periode: "2025–2030",
  },
  {
    id: "rv-9201",
    nummer: 9201,
    name: "9201 Vestfold og Telemark øst",
    type: "riksveg",
    region: "Vestfold og Telemark",
    entreprenor: "VEIDEKKE INDUSTRI AS",
    periode: "2023–2028",
  },
  {
    id: "rv-9204",
    nummer: 9204,
    name: "9204 Agder",
    type: "riksveg",
    region: "Agder",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2024–2029",
  },
  {
    id: "rv-9301",
    nummer: 9301,
    name: "9301 Stavanger",
    type: "riksveg",
    region: "Rogaland",
    entreprenor: "RISA AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9302",
    nummer: 9302,
    name: "9302 Haugesund",
    type: "riksveg",
    region: "Rogaland",
    entreprenor: "MESTA AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9303",
    nummer: 9303,
    name: "9303 Hardanger og Sogn",
    type: "riksveg",
    region: "Vestland",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9304",
    nummer: 9304,
    name: "9304 Bergen",
    type: "riksveg",
    region: "Vestland",
    entreprenor: "MESTA AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9305",
    nummer: 9305,
    name: "9305 Sunnfjord",
    type: "riksveg",
    region: "Vestland",
    entreprenor: "MESTA AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9306",
    nummer: 9306,
    name: "9306 Nordfjord",
    type: "riksveg",
    region: "Vestland",
    entreprenor: "MESTA AS",
    periode: "2023–2028",
  },
  {
    id: "rv-9403",
    nummer: 9403,
    name: "9403 Nordmøre",
    type: "riksveg",
    region: "Møre og Romsdal",
    entreprenor: "MESTA AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9404",
    nummer: 9404,
    name: "9404 Sunnmøre og Indre Romsdal",
    type: "riksveg",
    region: "Møre og Romsdal",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2023–2028",
  },
  {
    id: "rv-9405",
    nummer: 9405,
    name: "9405 Trøndelag Sør",
    type: "riksveg",
    region: "Trøndelag",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2025–2030",
  },
  {
    id: "rv-9406",
    nummer: 9406,
    name: "9406 Trøndelag nord",
    type: "riksveg",
    region: "Trøndelag",
    entreprenor: "VEIDEKKE INDUSTRI AS",
    periode: "2025–2030",
  },
  {
    id: "rv-1814",
    nummer: 1814,
    name: "1814 Helgeland nord",
    type: "riksveg",
    region: "Nordland",
    entreprenor: "HÆHRE ENTREPRENØR AS",
    periode: "2015–2030",
  },
  {
    id: "rv-1815",
    nummer: 1815,
    name: "1815 Helgeland sør",
    type: "riksveg",
    region: "Nordland",
    entreprenor: "SKANSKA NORGE AS",
    periode: "2017–2032",
  },
  {
    id: "rv-9502",
    nummer: 9502,
    name: "9502 Salten",
    type: "riksveg",
    region: "Nordland",
    entreprenor: "MESTA AS",
    periode: "2025–2030",
  },
  {
    id: "rv-9503",
    nummer: 9503,
    name: "9503 Midtre Hålogaland",
    type: "riksveg",
    region: "Nordland",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9504",
    nummer: 9504,
    name: "9504 Sør-Troms",
    type: "riksveg",
    region: "Troms",
    entreprenor: "MESTA AS",
    periode: "2023–2028",
  },
  {
    id: "rv-9505",
    nummer: 9505,
    name: "9505 Nord-Troms",
    type: "riksveg",
    region: "Troms",
    entreprenor: "ANLEGG NORD AS",
    periode: "2022–2027",
  },
  {
    id: "rv-9506",
    nummer: 9506,
    name: "9506 Vest-Finnmark",
    type: "riksveg",
    region: "Finnmark",
    entreprenor: "PRESIS VEGDRIFT AS",
    periode: "2021–2026",
  },
  {
    id: "rv-9507",
    nummer: 9507,
    name: "9507 Øst-Finnmark",
    type: "riksveg",
    region: "Finnmark",
    entreprenor: "MESTA AS",
    periode: "2023–2028",
  },
  {
    id: "rv-9508",
    nummer: 9508,
    name: "9508 Ofoten",
    type: "riksveg",
    region: "Nordland",
    entreprenor: "SVEVIA NORGE AS",
    periode: "2023–2028",
  },
]

// Felleskontrakter (riks- og fylkesveg)
export const felleskontakter: ContractArea[] = [
  {
    id: "fk-0801",
    nummer: 801,
    name: "0801 Telemark vest",
    type: "felleskontrakt",
    region: "Vestfold og Telemark",
    entreprenor: "MESTA AS",
    periode: "2018–2026",
  },
]

// Elektrokontrakter
export const elektrokontrakter: ContractArea[] = [
  {
    id: "ek-9151",
    nummer: 9151,
    name: "9151 Stor-Oslo Veglys",
    type: "elektro",
    region: "Oslo/Akershus",
    entreprenor: "MESTA AS",
    periode: "2021–2027",
  },
  {
    id: "ek-9152",
    nummer: 9152,
    name: "9152 Innlandet Veglys",
    type: "elektro",
    region: "Innlandet",
    entreprenor: "TRAFTEC AS",
    periode: "2021–2026",
  },
  {
    id: "ek-9161",
    nummer: 9161,
    name: "9161 Oslo elektro og automasjon",
    type: "elektro",
    region: "Oslo",
    entreprenor: "MESTA AS",
    periode: "2023–2028",
  },
  {
    id: "ek-9162",
    nummer: 9162,
    name: "9162 Akershus–Østfold",
    type: "elektro",
    region: "Akershus/Østfold",
    entreprenor: "SET ELEKTRO AS",
    periode: "2025–2030",
  },
  {
    id: "ek-9163",
    nummer: 9163,
    name: "9163 Innlandet elektro og automasjon",
    type: "elektro",
    region: "Innlandet",
    entreprenor: "MESTA AS",
    periode: "2025–2029",
  },
  {
    id: "ek-9164",
    nummer: 9164,
    name: "9164 Buskerud",
    type: "elektro",
    region: "Buskerud",
    entreprenor: "MESTA AS",
    periode: "2025–2030",
  },
  {
    id: "ek-9165",
    nummer: 9165,
    name: "9165 Stor-Oslo trafikksignalanlegg",
    type: "elektro",
    region: "Oslo",
    entreprenor: "TRAFTEC AS",
    periode: "2023–2028",
  },
  {
    id: "ek-9254",
    nummer: 9254,
    name: "9254 Vestfold og Telemark øst",
    type: "elektro",
    region: "Vestfold og Telemark",
    entreprenor: "MESTA AS",
    periode: "2023–2028",
  },
  {
    id: "ek-9255",
    nummer: 9255,
    name: "9255 Agder og Telemark vest",
    type: "elektro",
    region: "Agder/Telemark",
    entreprenor: "TRAFTEC AS",
    periode: "2023–2028",
  },
  {
    id: "ek-9351",
    nummer: 9351,
    name: "9351 Rogaland og Sunnhordaland",
    type: "elektro",
    region: "Rogaland/Vestland",
    entreprenor: "BMO ELEKTRO AS",
    periode: "2022–2027",
  },
  {
    id: "ek-9352",
    nummer: 9352,
    name: "9352 Bergen",
    type: "elektro",
    region: "Vestland",
    entreprenor: "BMO ELEKTRO AS",
    periode: "2022–2027",
  },
  {
    id: "ek-9353",
    nummer: 9353,
    name: "9353 Hardanger og Sogn",
    type: "elektro",
    region: "Vestland",
    entreprenor: "BMO ELEKTRO AS",
    periode: "2022–2027",
  },
  {
    id: "ek-9354",
    nummer: 9354,
    name: "9354 Fjordane",
    type: "elektro",
    region: "Vestland",
    entreprenor: "MESTA AS",
    periode: "2022–2027",
  },
  {
    id: "ek-9451",
    nummer: 9451,
    name: "9451 Trøndelag",
    type: "elektro",
    region: "Trøndelag",
    entreprenor: "TRAFTEC AS",
    periode: "2022–2026",
  },
  {
    id: "ek-9452",
    nummer: 9452,
    name: "9452 Møre og Romsdal",
    type: "elektro",
    region: "Møre og Romsdal",
    entreprenor: "MESTA AS",
    periode: "2022–2026",
  },
  {
    id: "ek-9551",
    nummer: 9551,
    name: "9551 Helgeland og Salten",
    type: "elektro",
    region: "Nordland",
    entreprenor: "BMO ELEKTRO AS",
    periode: "2025–2030",
  },
  {
    id: "ek-9552",
    nummer: 9552,
    name: "9552 Midtre Hålogaland",
    type: "elektro",
    region: "Nordland",
    entreprenor: "SET ELEKTRO AS",
    periode: "2025–2030",
  },
  {
    id: "ek-9553",
    nummer: 9553,
    name: "9553 Troms",
    type: "elektro",
    region: "Troms",
    entreprenor: "BMO ELEKTRO AS",
    periode: "2022–2027",
  },
  {
    id: "ek-9554",
    nummer: 9554,
    name: "9554 Finnmark",
    type: "elektro",
    region: "Finnmark",
    entreprenor: "GAGAMA ELEKTRO AS",
    periode: "2023–2028",
  },
]

// Alle kontrakter samlet
export const contractAreas: ContractArea[] = [...riksvegkontrakter, ...felleskontakter]

// Hent unike regioner
export const regions = [...new Set(contractAreas.map((c) => c.region))].sort()

// Hent kontraktstyper
export const contractTypes = [
  { id: "riksveg", name: "Riksvegkontrakter" },
  { id: "felleskontrakt", name: "Felleskontrakter (riks- og fylkesveg)" },
  { id: "elektro", name: "Elektrokontrakter" },
]

// Filtrer kontrakter
export function filterContracts(type?: string, region?: string): ContractArea[] {
  return contractAreas.filter((c) => {
    if (type && c.type !== type) return false
    if (region && c.region !== region) return false
    return true
  })
}

// Hent kontrakter der Mesta er entreprenør
export function getMestaContracts(): ContractArea[] {
  return contractAreas.filter((c) => c.entreprenor === "MESTA AS")
}

// Hent kontrakt etter nummer
export function getContractByNummer(nummer: number): ContractArea | undefined {
  return contractAreas.find((c) => c.nummer === nummer)
}
