// Frost API integrasjon for værstasjoner
// Dokumentasjon: https://frost.met.no/

export interface FrostWeatherStation {
  id: string
  name: string
  shortName?: string
  municipality?: string
  county?: string
  countryCode: string
  geometry: {
    type: "Point"
    coordinates: [number, number, number?] // [lon, lat, altitude?]
  }
  masl?: number // meters above sea level
  validFrom?: string
  validTo?: string
  externalIds?: string[]
  wigosId?: string
}

export interface FrostObservation {
  sourceId: string
  referenceTime: string
  observations: {
    elementId: string
    value: number
    unit: string
    qualityCode: number
  }[]
}

// Frost API krever registrering - vi bruker MET locationforecast som fallback
// For produksjon: registrer på https://frost.met.no/auth/requestCredentials.html

const MET_API_BASE = "https://api.met.no/weatherapi"

// Hent værstasjoner innenfor et geografisk område
export async function fetchWeatherStationsInArea(bounds: {
  north: number
  south: number
  east: number
  west: number
}): Promise<FrostWeatherStation[]> {
  // Frost API krever autentisering - vi bruker en forhåndsdefinert liste
  // med kjente værstasjoner i Norge kombinert med MET API
  return getKnownWeatherStations(bounds)
}

// Kjente værstasjoner i Norge med koordinater
// Fra met.no og frost.met.no
function getKnownWeatherStations(bounds: {
  north: number
  south: number
  east: number
  west: number
}): FrostWeatherStation[] {
  const allStations: FrostWeatherStation[] = [
    // Finnmark
    {
      id: "SN99710",
      name: "Vardø Radio",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [31.1069, 70.3693] },
      masl: 14,
    },
    {
      id: "SN99720",
      name: "Vadsø",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [29.8447, 70.0653] },
      masl: 10,
    },
    {
      id: "SN99370",
      name: "Kirkenes Lufthavn",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [29.8914, 69.7258] },
      masl: 89,
    },
    {
      id: "SN99450",
      name: "Tana Bru",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [28.0233, 70.2081] },
      masl: 7,
    },
    {
      id: "SN99350",
      name: "Karasjok",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [25.5119, 69.4669] },
      masl: 129,
    },
    {
      id: "SN93700",
      name: "Hammerfest",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [23.6686, 70.6792] },
      masl: 10,
    },
    {
      id: "SN93140",
      name: "Alta Lufthavn",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [23.3572, 69.9761] },
      masl: 3,
    },
    {
      id: "SN99840",
      name: "Honningsvåg",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [25.9833, 70.9667] },
      masl: 10,
    },
    {
      id: "SN99790",
      name: "Berlevåg",
      county: "Finnmark",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [29.0922, 70.8578] },
      masl: 13,
    },

    // Troms
    {
      id: "SN90450",
      name: "Tromsø",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [18.9553, 69.6539] },
      masl: 100,
    },
    {
      id: "SN90400",
      name: "Tromsø Langnes",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [18.9189, 69.6833] },
      masl: 8,
    },
    {
      id: "SN89350",
      name: "Bardufoss",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [18.5403, 69.0558] },
      masl: 76,
    },
    {
      id: "SN89950",
      name: "Skibotn",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [20.2503, 69.3833] },
      masl: 3,
    },
    {
      id: "SN90490",
      name: "Finnsnes",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [17.9833, 69.2333] },
      masl: 5,
    },
    {
      id: "SN90800",
      name: "Andøya",
      county: "Troms",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [16.1444, 69.3125] },
      masl: 10,
    },

    // Nordland
    {
      id: "SN87110",
      name: "Bodø VI",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [14.3653, 67.265] },
      masl: 11,
    },
    {
      id: "SN85380",
      name: "Narvik Lufthavn",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [17.3867, 68.4369] },
      masl: 27,
    },
    {
      id: "SN86500",
      name: "Svolvær Lufthavn",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [14.6692, 68.2433] },
      masl: 9,
    },
    {
      id: "SN86740",
      name: "Leknes",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [13.6094, 68.1528] },
      masl: 26,
    },
    {
      id: "SN82290",
      name: "Mo i Rana Lufthavn",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [14.3014, 66.3636] },
      masl: 70,
    },
    {
      id: "SN81680",
      name: "Mosjøen Lufthavn",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [13.215, 65.7839] },
      masl: 72,
    },
    {
      id: "SN80700",
      name: "Brønnøysund",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [12.2175, 65.4617] },
      masl: 9,
    },
    {
      id: "SN87640",
      name: "Fauske",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [15.3917, 67.2586] },
      masl: 55,
    },
    {
      id: "SN85892",
      name: "Sortland",
      county: "Nordland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [15.4125, 68.6928] },
      masl: 10,
    },

    // Trøndelag
    {
      id: "SN68860",
      name: "Trondheim Værnes",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [10.9244, 63.4578] },
      masl: 12,
    },
    {
      id: "SN68230",
      name: "Trondheim Voll",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [10.4531, 63.41] },
      masl: 127,
    },
    {
      id: "SN69100",
      name: "Steinkjer",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [11.4953, 64.0147] },
      masl: 7,
    },
    {
      id: "SN69380",
      name: "Namsos Lufthavn",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [11.5786, 64.4722] },
      masl: 2,
    },
    {
      id: "SN67560",
      name: "Røros",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [11.3428, 62.5781] },
      masl: 628,
    },
    {
      id: "SN70850",
      name: "Ørland",
      county: "Trøndelag",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [9.6039, 63.7] },
      masl: 10,
    },

    // Møre og Romsdal
    {
      id: "SN62480",
      name: "Ålesund Lufthavn",
      county: "Møre og Romsdal",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [6.1197, 62.5622] },
      masl: 21,
    },
    {
      id: "SN64550",
      name: "Kristiansund Lufthavn",
      county: "Møre og Romsdal",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [7.8242, 63.1119] },
      masl: 62,
    },
    {
      id: "SN61630",
      name: "Molde Lufthavn",
      county: "Møre og Romsdal",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [7.2625, 62.7447] },
      masl: 3,
    },

    // Vestland
    {
      id: "SN50540",
      name: "Bergen Florida",
      county: "Vestland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [5.3327, 60.3831] },
      masl: 12,
    },
    {
      id: "SN50500",
      name: "Bergen Flesland",
      county: "Vestland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [5.2181, 60.29] },
      masl: 48,
    },
    {
      id: "SN55700",
      name: "Sogndal Lufthavn",
      county: "Vestland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [7.1372, 61.1561] },
      masl: 8,
    },
    {
      id: "SN57770",
      name: "Florø Lufthavn",
      county: "Vestland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [5.0247, 61.5836] },
      masl: 9,
    },

    // Rogaland
    {
      id: "SN44560",
      name: "Stavanger Sola",
      county: "Rogaland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [5.6372, 58.8767] },
      masl: 7,
    },
    {
      id: "SN46610",
      name: "Haugesund Lufthavn",
      county: "Rogaland",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [5.2083, 59.3453] },
      masl: 26,
    },

    // Agder
    {
      id: "SN39040",
      name: "Kristiansand Kjevik",
      county: "Agder",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [8.0853, 58.2042] },
      masl: 17,
    },
    {
      id: "SN36200",
      name: "Lista Fyr",
      county: "Agder",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [6.5689, 58.1092] },
      masl: 14,
    },

    // Østlandet
    {
      id: "SN18700",
      name: "Oslo Blindern",
      county: "Oslo",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [10.7231, 59.9423] },
      masl: 94,
    },
    {
      id: "SN17150",
      name: "Oslo Gardermoen",
      county: "Viken",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [11.0847, 60.2028] },
      masl: 202,
    },
    {
      id: "SN27500",
      name: "Lillehammer",
      county: "Innlandet",
      countryCode: "NO",
      geometry: { type: "Point", coordinates: [10.4669, 61.1153] },
      masl: 241,
    },
  ]

  // Filtrer stasjoner innenfor bounding box
  return allStations.filter((station) => {
    const [lon, lat] = station.geometry.coordinates
    return lat <= bounds.north && lat >= bounds.south && lon <= bounds.east && lon >= bounds.west
  })
}

// Konverter værstasjon til lokasjon
export function stationToLocation(station: FrostWeatherStation): {
  name: string
  lat: number
  lon: number
  type: "weather_station"
  stationId: string
  priority: number
} {
  const [lon, lat] = station.geometry.coordinates
  return {
    name: station.name.replace(" Lufthavn", "").replace(" Radio", "").replace(" Fyr", ""),
    lat,
    lon,
    type: "weather_station",
    stationId: station.id,
    priority: 1, // Høyeste prioritet for værstasjoner
  }
}
