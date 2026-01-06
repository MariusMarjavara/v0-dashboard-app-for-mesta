import { NextResponse } from "next/server"

const cache = new Map<string, { vegreferanse: string; avstand: number; timestamp: number }>()
const CACHE_TTL = 3600000

const MAX_DISTANCE = 100
const FALLBACK_DISTANCE = 300

export async function POST(req: Request) {
  try {
    const { lat, lon } = await req.json()

    if (!lat || !lon || typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "Invalid lat/lon parameters" }, { status: 400 })
    }

    const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`
    const cached = cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const { vegreferanse, avstand } = cached
      const status = vegreferanse.startsWith("~") ? "estimated" : "found"
      return NextResponse.json({
        status,
        vegreferanse,
        avstand,
        kilde: "on-demand",
      })
    }

    const primaryRes = await fetch(
      `https://nvdbapiles-v3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=${MAX_DISTANCE}&srid=4326`,
      {
        headers: {
          "X-Client": "mesta-drift-app",
          Accept: "application/json",
        },
      },
    )

    if (primaryRes.ok) {
      const data = await primaryRes.json()
      const vegreferanse = data?.vegreferanse?.kortform
      const avstand = data?.avstand || 0

      if (vegreferanse) {
        cache.set(cacheKey, { vegreferanse, avstand, timestamp: Date.now() })
        return NextResponse.json({
          status: "found",
          vegreferanse,
          avstand: Math.round(avstand),
          kilde: "on-demand",
        })
      }
    }

    const fallbackRes = await fetch(
      `https://nvdbapiles-v3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=${FALLBACK_DISTANCE}&srid=4326`,
      {
        headers: {
          "X-Client": "mesta-drift-app",
          Accept: "application/json",
        },
      },
    )

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json()
      const vegreferanse = fallbackData?.vegreferanse?.kortform
      const avstand = fallbackData?.avstand || 0

      if (vegreferanse) {
        const estimatedRef = `~${vegreferanse}`
        cache.set(cacheKey, { vegreferanse: estimatedRef, avstand, timestamp: Date.now() })
        return NextResponse.json({
          status: "estimated",
          vegreferanse: estimatedRef,
          avstand: Math.round(avstand),
          kilde: "on-demand",
        })
      }
    }

    return NextResponse.json({
      status: "not_found",
    })
  } catch (error) {
    console.error("[VEGREFERANSE LOOKUP] Error:", error)
    return NextResponse.json({ status: "not_found" }, { status: 200 })
  }
}
