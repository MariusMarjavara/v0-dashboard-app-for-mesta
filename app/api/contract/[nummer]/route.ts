import { type NextRequest, NextResponse } from "next/server"
import { getContractWithLocations, syncContractToDatabase } from "@/lib/contract-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ nummer: string }> }) {
  const { nummer } = await params
  const contractNummer = Number.parseInt(nummer, 10)

  if (isNaN(contractNummer)) {
    return NextResponse.json({ error: "Invalid contract number" }, { status: 400 })
  }

  try {
    const { contract, locations } = await getContractWithLocations(contractNummer)

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    return NextResponse.json({
      contract,
      locations,
    })
  } catch (error) {
    console.error("Error fetching contract:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST for å synkronisere kontrakt til database
export async function POST(request: NextRequest, { params }: { params: Promise<{ nummer: string }> }) {
  const { nummer } = await params
  const contractNummer = Number.parseInt(nummer, 10)

  if (isNaN(contractNummer)) {
    return NextResponse.json({ error: "Invalid contract number" }, { status: 400 })
  }

  try {
    const success = await syncContractToDatabase(contractNummer)

    if (!success) {
      return NextResponse.json({ error: "Failed to sync contract" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error syncing contract:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
