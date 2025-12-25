import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateOperationalStatus } from "@/lib/operational-status"
import { REGISTRATION_TYPES } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as File
    const metadataStr = formData.get("metadata") as string

    if (!metadataStr) {
      return NextResponse.json({ error: "No metadata provided" }, { status: 400 })
    }

    const metadata = JSON.parse(metadataStr)

    if (
      !metadata.transcript ||
      metadata.transcript.trim() === "" ||
      metadata.transcript === "[Transkribering feilet]"
    ) {
      return NextResponse.json(
        { error: "Transcript is required. Voice memo cannot be saved without transcription." },
        { status: 400 },
      )
    }

    if (!audio) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 })
    }

    const transcript = metadata.transcript

    const status = calculateOperationalStatus({
      transcript,
      hendelse: metadata.hendelse,
      tiltak: metadata.tiltak,
      vakttlf: metadata.vakttlf,
    })

    const supabase = await createClient()

    const row = {
      user_id: metadata.userId,
      registration_type: REGISTRATION_TYPES.VOICE_MEMO,
      contract_area: metadata.contractArea,
      contract_nummer: metadata.contractNummer,
      data: {
        type: metadata.type,
        vakttlf: metadata.vakttlf,
        ringer: metadata.ringer,
        hendelse: metadata.hendelse,
        tiltak: metadata.tiltak,
        transcript, // Guaranteed to have content
        timestamp: metadata.timestamp,
        operationalStatus: status,
      },
    }

    const { error: dbError } = await supabase.from("registrations").insert(row)

    if (dbError) {
      console.error("Database error:", dbError)
      throw new Error("Database insert failed")
    }

    return NextResponse.json({
      success: true,
      transcript,
      status,
      message: "Voice memo successfully saved with transcription",
    })
  } catch (error) {
    console.error("Voice memo error:", error)
    return NextResponse.json({ error: "Failed to process voice memo" }, { status: 500 })
  }
}
