export async function getVegreferanse(lat: number, lon: number): Promise<string | null> {
  try {
    console.log(`[v0] Henter vegreferanse for koordinater: ${lat}, ${lon}`)

    // NVDB Vegnett API for å finne nærmeste veg
    const vegUrl = `https://nvdbapiles-v3.atlas.vegvesen.no/vegnett/veglenkesekvenser/segmentert?lat=${lat}&lon=${lon}&maks_avstand=50&srid=wgs84`

    const vegResponse = await fetch(vegUrl)
    if (!vegResponse.ok) {
      console.log(`[v0] NVDB API feil: ${vegResponse.status}`)
      return null
    }

    const vegData = await vegResponse.json()

    if (!vegData.objekter || vegData.objekter.length === 0) {
      console.log("[v0] Ingen vegobjekter funnet i nærheten")
      return null
    }

    const veglenke = vegData.objekter[0]
    const vegsystemreferanse = veglenke.vegsystemreferanse

    if (!vegsystemreferanse) {
      return null
    }

    // Bygger vegreferansen
    const vegkategori = vegsystemreferanse.vegsystem.vegkategori
    const vegnummer = vegsystemreferanse.vegsystem.nummer
    const strekning = vegsystemreferanse.strekning?.nummer
    const delstrekning = vegsystemreferanse.strekning?.delstrekning
    const meter = vegsystemreferanse.strekning?.meter

    let vegreferanse = `${vegkategori}${vegnummer}`

    if (strekning) {
      vegreferanse += ` S${strekning}`
    }
    if (delstrekning) {
      vegreferanse += `D${delstrekning}`
    }
    if (meter !== undefined) {
      vegreferanse += ` m${meter}`
    }

    console.log(`[v0] Vegreferanse funnet: ${vegreferanse}`)
    return vegreferanse
  } catch (error) {
    console.error("[v0] Feil ved henting av vegreferanse:", error)
    return null
  }
}
