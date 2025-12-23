// Mapping mellom driftskontrakter og deres tilhørende steder
// Kilde: driftskontrakter_steder-dM4Pw.csv

export interface ContractLocationMapping {
  kontraktNummer: number
  steder: string[]
}

export const contractLocationsMapping: ContractLocationMapping[] = [
  {
    kontraktNummer: 9507,
    steder: [
      "Neiden",
      "Tana Bru",
      "Karasjok",
      "Levajok",
      "Valjok",
      "Sirbma",
      "Varangerbotn",
      "Vestre Jakobselv",
      "Vadsø",
      "Kiberg",
      "Vardø",
      "Bugøyfjord",
      "Høybuktmoen",
      "Kirkenes",
      "Storskog",
    ],
  },
  {
    kontraktNummer: 9506,
    steder: ["Hammerfest", "Alta (vest)", "Kvalsund", "Karasjok", "Indre Billefjord", "Sennalandet", "Skaidi"],
  },
  {
    kontraktNummer: 9505,
    steder: ["Alta", "Kautokeino", "Olderfjord", "Lakselv", "Stokkedalen", "Kvænangen", "Nordreisa", "Kåfjord"],
  },
  {
    kontraktNummer: 9504,
    steder: ["Tromsø", "Breivikeidet", "Fagernes", "Nordkjosbotn", "Skibotn", "Hatteng", "Bardufoss", "Forsetmoen"],
  },
  {
    kontraktNummer: 9503,
    steder: ["Harstad", "Gløpen", "Leknes", "Svolvær", "Hinnøy", "Sortland", "Lødingen", "Tjelsund"],
  },
  {
    kontraktNummer: 9502,
    steder: [
      "Tysfjorden",
      "Hamnneset",
      "Innhavet",
      "Saltdalen",
      "Rognan",
      "Tverrlandet",
      "Bodø",
      "Løding",
      "Straumen",
      "Fauske",
      "Junkerdalen",
    ],
  },
  {
    kontraktNummer: 9508,
    steder: ["Narvik", "Bjerkvik", "Evenes", "Ballangen", "Skjomen", "Drag"],
  },
  {
    kontraktNummer: 9406,
    steder: ["Steinkjer", "Verdal", "Levanger", "Inderøy", "Snåsa", "Grong", "Namsskogan"],
  },
  {
    kontraktNummer: 9405,
    steder: ["Trondheim", "Støren", "Melhus", "Oppdal"],
  },
  {
    kontraktNummer: 9404,
    steder: ["Ålesund", "Molde", "Ørsta", "Volda", "Sjøholt"],
  },
  {
    kontraktNummer: 9403,
    steder: ["Kristiansund", "Molde", "Averøy", "Tingvoll"],
  },
  {
    kontraktNummer: 9306,
    steder: ["Nordfjordeid", "Sandane", "Måløy", "Stryn"],
  },
  {
    kontraktNummer: 9305,
    steder: ["Førde", "Florø", "Naustdal", "Jølster"],
  },
  {
    kontraktNummer: 9304,
    steder: ["Bergen", "Arna", "Vaksdal", "Osterøy", "Knarvik"],
  },
  {
    kontraktNummer: 9303,
    steder: ["Odda", "Voss", "Eidfjord", "Sogndal", "Lærdal"],
  },
  {
    kontraktNummer: 9302,
    steder: ["Haugesund", "Kopervik", "Skudeneshavn", "Etne"],
  },
  {
    kontraktNummer: 9301,
    steder: ["Stavanger", "Sandnes", "Sola", "Bryne"],
  },
  {
    kontraktNummer: 9204,
    steder: ["Kristiansand", "Mandal", "Lillesand", "Grimstad", "Arendal", "Risør"],
  },
  {
    kontraktNummer: 9201,
    steder: ["Tønsberg", "Larvik", "Sandefjord", "Skien", "Porsgrunn", "Bamble"],
  },
  {
    kontraktNummer: 9108,
    steder: ["Elverum", "Hamar", "Kongsvinger", "Tynset", "Rena"],
  },
  {
    kontraktNummer: 9107,
    steder: ["Lillehammer", "Otta", "Dombås", "Vågåmo", "Lom"],
  },
  {
    kontraktNummer: 9106,
    steder: ["Gjøvik", "Raufoss", "Hamar", "Jessheim", "Kløfta"],
  },
  {
    kontraktNummer: 9104,
    steder: ["Oslo", "Lillestrøm", "Nittedal", "Ullensaker", "Gardermoen"],
  },
  {
    kontraktNummer: 9103,
    steder: ["Moss", "Fredrikstad", "Sarpsborg", "Halden", "Ski", "Ås", "Vestby"],
  },
  {
    kontraktNummer: 9102,
    steder: ["Gol", "Geilo", "Hemsedal", "Ål", "Fagernes", "Beitostølen"],
  },
  {
    kontraktNummer: 9101,
    steder: ["Drammen", "Lier", "Holmestrand", "Svelvik"],
  },
]

// Hent steder for en gitt kontrakt
export function getLocationsByContract(kontraktNummer: number): string[] {
  const mapping = contractLocationsMapping.find((m) => m.kontraktNummer === kontraktNummer)
  return mapping?.steder || []
}

// Sjekk om en kontrakt har definerte steder
export function hasLocationsForContract(kontraktNummer: number): boolean {
  return getLocationsByContract(kontraktNummer).length > 0
}
