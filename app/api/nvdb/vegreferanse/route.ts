import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon parameter" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://nvdbapiles-v3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=50`, {
      headers: {
        "X-Client": "stoetfangeren-app",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error("NVDB API failed")
    }

    const data = await res.json()
    const vegreferanse = data?.vegreferanse?.kortform || `${lat}, ${lon}`

    return NextResponse.json({ vegreferanse })
  } catch (error) {
    console.error("[v0] NVDB API error:", error)
    return NextResponse.json({ vegreferanse: `${lat}, ${lon}` }, { status: 200 })
  }
}
