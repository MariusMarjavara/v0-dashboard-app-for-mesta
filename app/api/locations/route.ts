import { NextResponse } from "next/server"
import { getPrioritizedLocations } from "@/lib/location-service"
import { fetchNVDBContractArea } from "@/lib/nvdb-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const contractId = searchParams.get("contractId") || "default"
  const maxLocations = Number.parseInt(searchParams.get("max") || "9", 10)

  try {
    // Ekstraher kontraktsnummer fra ID
    const contractNumber = Number.parseInt(contractId.replace("sv-", ""), 10)

    // Forsøk å hente kontraktsområde fra NVDB
    let nvdbContract = null
    if (!isNaN(contractNumber)) {
      nvdbContract = await fetchNVDBContractArea(contractNumber)
    }

    // Hent prioriterte lokasjoner
    const locations = await getPrioritizedLocations(nvdbContract, contractId, maxLocations)

    return NextResponse.json({
      contractId,
      contractName: nvdbContract?.navn || contractId,
      locations,
      source: nvdbContract ? "nvdb" : "predefined",
    })
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Kunne ikke hente lokasjoner" }, { status: 500 })
  }
}
