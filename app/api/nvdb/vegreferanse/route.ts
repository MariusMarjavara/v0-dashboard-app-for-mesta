import { NextResponse } from "next/server"

// In-memory cache for vegreferanse lookups (prevents repeated NVDB API calls)
const cache = new Map<string, { vegreferanse: string; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour in milliseconds

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon parameter" }, { status: 400 })
  }

  const cacheKey = `${lat},${lon}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ vegreferanse: cached.vegreferanse })
  }

  try {
    const res = await fetch(`https://nvdbapiles-v3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=50`, {
      headers: {
        "X-Client": "mesta-drift-app",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error("NVDB API failed")
    }

    const data = await res.json()
    const vegreferanse = data?.vegreferanse?.kortform || "Ikke på veg"

    cache.set(cacheKey, { vegreferanse, timestamp: Date.now() })

    // Clean up old cache entries (simple garbage collection)
    if (cache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key)
        }
      }
    }

    return NextResponse.json({ vegreferanse })
  } catch (error) {
    return NextResponse.json({ vegreferanse: "Ikke på veg" }, { status: 200 })
  }
}
