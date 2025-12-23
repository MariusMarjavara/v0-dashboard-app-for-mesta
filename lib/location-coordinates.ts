// Koordinater for steder i Norge
// Brukes til værdata-henting for kontraktsområder

export interface LocationCoordinate {
  name: string
  lat: number
  lon: number
  type: "city" | "town" | "village" | "coastal" | "border" | "poi"
}

export const locationCoordinates: Record<string, LocationCoordinate> = {
  // Finnmark - DK 9507
  Neiden: { name: "Neiden", lat: 69.7425, lon: 29.2367, type: "border" },
  "Tana bru": { name: "Tana Bru", lat: 70.1944, lon: 28.1625, type: "town" },
  Karasjok: { name: "Karasjok", lat: 69.4727, lon: 25.5065, type: "town" },
  Levajok: { name: "Levajok", lat: 70.1333, lon: 27.8667, type: "village" },
  Valjok: { name: "Valjok", lat: 69.8833, lon: 27.0167, type: "village" },
  Sirbma: { name: "Sirma", lat: 70.0833, lon: 27.4667, type: "village" },
  Varangerbotn: { name: "Varangerbotn", lat: 70.0175, lon: 28.8333, type: "coastal" },
  "Vestre Jakobselv": { name: "Vestre Jakobselv", lat: 70.0833, lon: 29.5167, type: "coastal" },
  Vadsø: { name: "Vadsø", lat: 70.0744, lon: 29.7488, type: "city" },
  Kiberg: { name: "Kiberg", lat: 70.2667, lon: 30.95, type: "coastal" },
  Vardø: { name: "Vardø", lat: 70.3706, lon: 31.1089, type: "coastal" },
  Bugøyfjord: { name: "Bugøyfjord", lat: 69.9667, lon: 29.6667, type: "coastal" },
  Høybuktmoen: { name: "Høybuktmoen", lat: 69.7167, lon: 29.9, type: "town" },
  Kirkenes: { name: "Kirkenes", lat: 69.7267, lon: 30.0425, type: "city" },
  Storskog: { name: "Storskog", lat: 69.6508, lon: 30.0872, type: "border" },

  // Finnmark - DK 9506
  Hammerfest: { name: "Hammerfest", lat: 70.6634, lon: 23.6821, type: "city" },
  "Alta (vest)": { name: "Alta", lat: 69.9689, lon: 23.2717, type: "city" },
  Kvalsund: { name: "Kvalsund", lat: 70.4739, lon: 23.9772, type: "village" },
  Hasvik: { name: "Hasvik", lat: 70.4889, lon: 22.1397, type: "village" },
  "Indre Billefjord": { name: "Indre Billefjord", lat: 69.9611, lon: 22.9497, type: "village" },
  Sennalandet: { name: "Sennalandet", lat: 70.2333, lon: 23.1167, type: "village" },
  Skaidi: { name: "Skaidi", lat: 70.1333, lon: 24.4667, type: "village" },

  // Finnmark/Troms - DK 9505
  Alta: { name: "Alta", lat: 69.9689, lon: 23.2717, type: "city" },
  Kautokeino: { name: "Kautokeino", lat: 69.0122, lon: 23.0408, type: "town" },
  Olderfjord: { name: "Olderfjord", lat: 70.4806, lon: 25.3667, type: "village" },
  Lakselv: { name: "Lakselv", lat: 70.0511, lon: 24.9647, type: "town" },
  Stokkedalen: { name: "Stokkedalen", lat: 70.1333, lon: 24.3667, type: "village" },
  Kvænangen: { name: "Kvænangen", lat: 69.9333, lon: 22.0667, type: "village" },
  Nordreisa: { name: "Nordreisa", lat: 69.7558, lon: 21.0008, type: "town" },
  Kåfjord: { name: "Kåfjord", lat: 69.6167, lon: 20.8167, type: "village" },

  // Troms - DK 9504
  Tromsø: { name: "Tromsø", lat: 69.6492, lon: 18.9553, type: "city" },
  Finnsnes: { name: "Finnsnes", lat: 69.2306, lon: 17.9817, type: "town" },
  Bardufoss: { name: "Bardufoss", lat: 69.0572, lon: 18.5403, type: "town" },
  Senja: { name: "Senja", lat: 69.3, lon: 17.5, type: "village" },
  Breivikeidet: { name: "Breivikeidet", lat: 69.6778, lon: 18.9306, type: "village" },
  Nordkjosbotn: { name: "Nordkjosbotn", lat: 69.2378, lon: 19.9628, type: "village" },
  Skibotn: { name: "Skibotn", lat: 69.3833, lon: 20.2667, type: "village" },
  Hatteng: { name: "Hatteng", lat: 69.0667, lon: 19.3833, type: "village" },
  Forsetmoen: { name: "Forsetmoen", lat: 69.0167, lon: 18.4333, type: "village" },

  // Nordland - DK 9503
  Narvik: { name: "Narvik", lat: 68.4385, lon: 17.4272, type: "city" },
  Evenes: { name: "Evenes", lat: 68.4911, lon: 16.5636, type: "village" },
  Ballangen: { name: "Ballangen", lat: 68.3461, lon: 16.8942, type: "village" },
  Tjeldsund: { name: "Tjeldsund", lat: 68.55, lon: 16.6, type: "village" },
  Harstad: { name: "Harstad", lat: 68.7983, lon: 16.5414, type: "city" },
  Gløpen: { name: "Gløpen", lat: 68.7583, lon: 16.6167, type: "village" },
  Leknes: { name: "Leknes", lat: 68.1467, lon: 13.6086, type: "town" },
  Svolvær: { name: "Svolvær", lat: 68.2343, lon: 14.5683, type: "town" },
  Hinnøy: { name: "Hinnøy", lat: 68.7, lon: 16.5, type: "village" },
  Sortland: { name: "Sortland", lat: 68.6986, lon: 15.4111, type: "town" },
  Lødingen: { name: "Lødingen", lat: 68.4081, lon: 16.0272, type: "village" },
  Tjelsund: { name: "Tjelsund", lat: 68.5167, lon: 16.4333, type: "village" },

  // Nordland - DK 9502
  Bodø: { name: "Bodø", lat: 67.2804, lon: 14.405, type: "city" },
  Fauske: { name: "Fauske", lat: 67.2594, lon: 15.3944, type: "town" },
  Rognan: { name: "Rognan", lat: 67.0972, lon: 15.3958, type: "town" },
  Inndyr: { name: "Inndyr", lat: 67.4644, lon: 15.0711, type: "village" },
  Valnesfjord: { name: "Valnesfjord", lat: 67.5164, lon: 15.3917, type: "village" },
  Tysfjorden: { name: "Tysfjorden", lat: 68.1, lon: 16.5, type: "village" },
  Hamnneset: { name: "Hamnneset", lat: 67.6333, lon: 14.85, type: "village" },
  Innhavet: { name: "Innhavet", lat: 67.35, lon: 14.6833, type: "coastal" },
  Saltdalen: { name: "Saltdalen", lat: 67.1667, lon: 15.5167, type: "village" },
  Tverrlandet: { name: "Tverrlandet", lat: 67.4167, lon: 14.75, type: "village" },
  Løding: { name: "Løding", lat: 67.2333, lon: 14.9167, type: "village" },
  Straumen: { name: "Straumen", lat: 67.2333, lon: 14.6333, type: "village" },
  Junkerdalen: { name: "Junkerdalen", lat: 67.0167, lon: 16.0833, type: "village" },

  // Nordland - DK 9508
  Bjerkvik: { name: "Bjerkvik", lat: 68.5089, lon: 17.6561, type: "village" },
  Skjomen: { name: "Skjomen", lat: 68.325, lon: 17.4917, type: "village" },
  Drag: { name: "Drag", lat: 67.9717, lon: 15.0028, type: "village" },

  // Trøndelag - DK 9406
  Steinkjer: { name: "Steinkjer", lat: 64.0148, lon: 11.4953, type: "city" },
  Verdal: { name: "Verdal", lat: 63.7925, lon: 11.4861, type: "town" },
  Levanger: { name: "Levanger", lat: 63.7458, lon: 11.3017, type: "town" },
  Inderøy: { name: "Inderøy", lat: 63.8697, lon: 11.2944, type: "village" },
  Snåsa: { name: "Snåsa", lat: 64.2469, lon: 12.3825, type: "village" },
  Grong: { name: "Grong", lat: 64.4653, lon: 12.3158, type: "village" },
  Namsskogan: { name: "Namsskogan", lat: 64.9303, lon: 13.1567, type: "village" },

  // Trøndelag - DK 9405
  Trondheim: { name: "Trondheim", lat: 63.4305, lon: 10.3951, type: "city" },
  Støren: { name: "Støren", lat: 63.0289, lon: 10.285, type: "town" },
  Melhus: { name: "Melhus", lat: 63.2867, lon: 10.2756, type: "town" },
  Oppdal: { name: "Oppdal", lat: 62.595, lon: 9.6917, type: "town" },

  // Møre og Romsdal - DK 9404
  Ålesund: { name: "Ålesund", lat: 62.4722, lon: 6.1549, type: "city" },
  Molde: { name: "Molde", lat: 62.7375, lon: 7.1594, type: "city" },
  Ørsta: { name: "Ørsta", lat: 62.1992, lon: 6.1314, type: "town" },
  Volda: { name: "Volda", lat: 62.1475, lon: 6.0717, type: "town" },
  Sjøholt: { name: "Sjøholt", lat: 62.2911, lon: 6.5386, type: "village" },

  // Møre og Romsdal - DK 9403
  Kristiansund: { name: "Kristiansund", lat: 63.1107, lon: 7.7278, type: "city" },
  Averøy: { name: "Averøy", lat: 63.0439, lon: 7.6847, type: "village" },
  Tingvoll: { name: "Tingvoll", lat: 62.9161, lon: 8.1925, type: "village" },

  // Vestland - DK 9306
  Nordfjordeid: { name: "Nordfjordeid", lat: 61.9011, lon: 6.0017, type: "town" },
  Sandane: { name: "Sandane", lat: 61.7703, lon: 6.2133, type: "town" },
  Måløy: { name: "Måløy", lat: 61.9356, lon: 5.1122, type: "town" },
  Stryn: { name: "Stryn", lat: 61.9111, lon: 6.7211, type: "town" },

  // Vestland - DK 9305
  Førde: { name: "Førde", lat: 61.4519, lon: 5.8575, type: "city" },
  Florø: { name: "Florø", lat: 61.6, lon: 5.0328, type: "city" },
  Naustdal: { name: "Naustdal", lat: 61.5131, lon: 5.7064, type: "village" },
  Jølster: { name: "Jølster", lat: 61.4739, lon: 6.2906, type: "village" },

  // Vestland - DK 9304
  Bergen: { name: "Bergen", lat: 60.3913, lon: 5.3221, type: "city" },
  Arna: { name: "Arna", lat: 60.4203, lon: 5.4683, type: "town" },
  Vaksdal: { name: "Vaksdal", lat: 60.5697, lon: 5.8103, type: "village" },
  Osterøy: { name: "Osterøy", lat: 60.5333, lon: 5.5167, type: "village" },
  Knarvik: { name: "Knarvik", lat: 60.5447, lon: 5.2853, type: "town" },

  // Vestland - DK 9303
  Odda: { name: "Odda", lat: 60.0667, lon: 6.5458, type: "town" },
  Voss: { name: "Voss", lat: 60.6297, lon: 6.4156, type: "town" },
  Eidfjord: { name: "Eidfjord", lat: 60.4711, lon: 7.0742, type: "village" },
  Sogndal: { name: "Sogndal", lat: 61.2306, lon: 7.1006, type: "town" },
  Lærdal: { name: "Lærdal", lat: 61.1003, lon: 7.4778, type: "town" },

  // Rogaland - DK 9302
  Haugesund: { name: "Haugesund", lat: 59.4138, lon: 5.268, type: "city" },
  Kopervik: { name: "Kopervik", lat: 59.2817, lon: 5.3058, type: "town" },
  Skudeneshavn: { name: "Skudeneshavn", lat: 59.1478, lon: 5.2656, type: "town" },
  Etne: { name: "Etne", lat: 59.6597, lon: 5.9358, type: "village" },

  // Rogaland - DK 9301
  Stavanger: { name: "Stavanger", lat: 58.9701, lon: 5.7331, type: "city" },
  Sandnes: { name: "Sandnes", lat: 58.8517, lon: 5.7358, type: "city" },
  Sola: { name: "Sola", lat: 58.8867, lon: 5.6372, type: "town" },
  Bryne: { name: "Bryne", lat: 58.7353, lon: 5.6489, type: "town" },

  // Agder - DK 9204
  Kristiansand: { name: "Kristiansand", lat: 58.1467, lon: 7.9956, type: "city" },
  Mandal: { name: "Mandal", lat: 58.0292, lon: 7.4567, type: "town" },
  Lillesand: { name: "Lillesand", lat: 58.2469, lon: 8.3686, type: "town" },
  Grimstad: { name: "Grimstad", lat: 58.3406, lon: 8.5936, type: "town" },
  Arendal: { name: "Arendal", lat: 58.4619, lon: 8.7722, type: "city" },
  Risør: { name: "Risør", lat: 58.7206, lon: 9.2328, type: "town" },

  // Vestfold og Telemark - DK 9201
  Tønsberg: { name: "Tønsberg", lat: 59.2672, lon: 10.4078, type: "city" },
  Larvik: { name: "Larvik", lat: 59.0535, lon: 10.0349, type: "city" },
  Sandefjord: { name: "Sandefjord", lat: 59.1311, lon: 10.2167, type: "city" },
  Skien: { name: "Skien", lat: 59.2089, lon: 9.6086, type: "city" },
  Porsgrunn: { name: "Porsgrunn", lat: 59.1403, lon: 9.6564, type: "city" },
  Bamble: { name: "Bamble", lat: 59.0167, lon: 9.6, type: "town" },

  // Innlandet - DK 9108
  Elverum: { name: "Elverum", lat: 60.8811, lon: 11.5628, type: "city" },
  Hamar: { name: "Hamar", lat: 60.7945, lon: 11.0679, type: "city" },
  Kongsvinger: { name: "Kongsvinger", lat: 60.1914, lon: 12.0019, type: "city" },
  Tynset: { name: "Tynset", lat: 62.2764, lon: 10.7811, type: "town" },
  Rena: { name: "Rena", lat: 61.1322, lon: 11.3656, type: "town" },

  // Innlandet - DK 9107
  Lillehammer: { name: "Lillehammer", lat: 61.1153, lon: 10.4662, type: "city" },
  Otta: { name: "Otta", lat: 61.7733, lon: 9.5369, type: "town" },
  Dombås: { name: "Dombås", lat: 62.0764, lon: 9.1294, type: "village" },
  Vågåmo: { name: "Vågåmo", lat: 61.8825, lon: 9.3264, type: "village" },
  Lom: { name: "Lom", lat: 61.8364, lon: 8.5694, type: "village" },

  // Innlandet/Akershus - DK 9106
  Gjøvik: { name: "Gjøvik", lat: 60.7957, lon: 10.6915, type: "city" },
  Raufoss: { name: "Raufoss", lat: 60.7269, lon: 10.6128, type: "town" },
  Jessheim: { name: "Jessheim", lat: 60.1397, lon: 11.1708, type: "town" },
  Kløfta: { name: "Kløfta", lat: 60.0747, lon: 11.1375, type: "town" },

  // Oslo/Akershus - DK 9104
  Oslo: { name: "Oslo", lat: 59.9139, lon: 10.7522, type: "city" },
  Lillestrøm: { name: "Lillestrøm", lat: 59.9554, lon: 11.0464, type: "city" },
  Nittedal: { name: "Nittedal", lat: 60.0542, lon: 10.8561, type: "town" },
  Ullensaker: { name: "Ullensaker", lat: 60.1333, lon: 11.1667, type: "town" },
  Gardermoen: { name: "Gardermoen", lat: 60.1939, lon: 11.1004, type: "poi" },

  // Viken - DK 9103
  Moss: { name: "Moss", lat: 59.4353, lon: 10.6569, type: "city" },
  Fredrikstad: { name: "Fredrikstad", lat: 59.2181, lon: 10.9298, type: "city" },
  Sarpsborg: { name: "Sarpsborg", lat: 59.2839, lon: 11.1097, type: "city" },
  Halden: { name: "Halden", lat: 59.1244, lon: 11.3875, type: "city" },
  Ski: { name: "Ski", lat: 59.7189, lon: 10.8372, type: "town" },
  Ås: { name: "Ås", lat: 59.6611, lon: 10.7789, type: "town" },
  Vestby: { name: "Vestby", lat: 59.5511, lon: 10.7419, type: "town" },

  // Viken/Innlandet - DK 9102
  Gol: { name: "Gol", lat: 60.7067, lon: 8.9378, type: "town" },
  Geilo: { name: "Geilo", lat: 60.5342, lon: 8.2058, type: "town" },
  Hemsedal: { name: "Hemsedal", lat: 60.8653, lon: 8.5692, type: "village" },
  Ål: { name: "Ål", lat: 60.6297, lon: 8.5592, type: "village" },
  Fagernes: { name: "Fagernes", lat: 61.0061, lon: 9.2286, type: "town" },
  Beitostølen: { name: "Beitostølen", lat: 61.2467, lon: 8.9092, type: "village" },

  // Viken - DK 9101
  Drammen: { name: "Drammen", lat: 59.7439, lon: 10.2045, type: "city" },
  Lier: { name: "Lier", lat: 59.7825, lon: 10.2447, type: "town" },
  Holmestrand: { name: "Holmestrand", lat: 59.4889, lon: 10.3131, type: "town" },
  Svelvik: { name: "Svelvik", lat: 59.6028, lon: 10.41, type: "town" },
}

// Hent koordinater for et sted (case-insensitive)
export function getCoordinatesForLocation(locationName: string): LocationCoordinate | undefined {
  const normalized = locationName.trim()
  return locationCoordinates[normalized] || Object.values(locationCoordinates).find((loc) => loc.name === normalized)
}

// Hent alle koordinater for en liste av stedsnavn
export function getCoordinatesForLocations(locationNames: string[]): LocationCoordinate[] {
  return locationNames
    .map((name) => getCoordinatesForLocation(name))
    .filter((coord): coord is LocationCoordinate => coord !== undefined)
}
