import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateOperationalStatus } from "@/lib/operational-status"
import { classifyVoiceTranscript } from "@/lib/voice/classify"

export async function POST(req: NextRequest) {
  console.log("[v0] 🧠 /api/voice hit")
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as File
    const metadataStr = formData.get("metadata") as string

    console.log("[v0] 🧠 API received - audio:", !!audio, "metadata:", !!metadataStr)

    if (!metadataStr) {
      return NextResponse.json({ error: "No metadata provided" }, { status: 400 })
    }

    const metadata = JSON.parse(metadataStr)
    console.log("[v0] 🧠 Parsed metadata:", metadata)

    if (
      !metadata.transcript ||
      metadata.transcript.trim() === "" ||
      metadata.transcript === "[Transkribering feilet]"
    ) {
      console.error("[v0] ❌ Invalid transcript:", metadata.transcript)
      return NextResponse.json(
        { error: "Transcript is required. Voice memo cannot be saved without transcription." },
        { status: 400 },
      )
    }

    if (!audio) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 })
    }

    const transcript = metadata.transcript
    console.log("[v0] 🧠 Transcript:", transcript)

    const classification = classifyVoiceTranscript(transcript)
    console.log("[v0] 🎯 Classification:", classification)

    const status = calculateOperationalStatus({
      transcript,
      hendelse: metadata.hendelse,
      tiltak: metadata.tiltak,
      vakttlf: metadata.vakttlf,
    })

    console.log("[v0] 🧠 Operational status:", status)

    const supabase = await createClient()

    const row = {
      user_id: metadata.userId,
      registered_by_name: metadata.userName,
      registration_type: classification.registration_type,
      contract_area: metadata.contractArea,
      contract_nummer: metadata.contractNummer,
      data: {
        vakttlf: metadata.extracted?.vakttlf || false,
        oppringt_av: metadata.extracted?.oppringt_av || metadata.extracted?.ringer || null,
        hendelse: metadata.extracted?.hendelse || null,
        sted: metadata.extracted?.sted || null,
        strekning: metadata.extracted?.strekning || null,
        tiltak: metadata.extracted?.tiltak || null,
        operativ_status: status,
        kommentar: metadata.extracted?.kommentar || null,
        transcript,
        timestamp: metadata.timestamp,
        // Classification metadata
        classification: {
          type: classification.registration_type,
          subcategory: classification.subcategory,
          confidence: classification.confidence,
          keywords: classification.keywords,
        },
        // Source tracking
        source: "voice" as const,
        confidence: metadata.confidence || {},
      },
    }

    console.log("[v0] 🧠 Inserting row into database")

    const { error: dbError } = await supabase.from("registrations").insert(row)

    if (dbError) {
      console.error("[v0] ❌ Database error:", dbError)
      throw new Error("Database insert failed")
    }

    if (metadata.feedback && metadata.feedback.predicted_type !== metadata.feedback.corrected_type) {
      console.log("[v0] 📚 Storing classification feedback for adaptive learning")

      const { error: feedbackError } = await supabase.from("voice_classification_feedback").insert({
        transcript: transcript,
        predicted_type: metadata.feedback.predicted_type,
        corrected_type: metadata.feedback.corrected_type,
        user_id: metadata.userId,
      })

      if (feedbackError) {
        console.error("[v0] ⚠️ Feedback storage failed (non-critical):", feedbackError)
        // Don't fail the request if feedback storage fails
      } else {
        console.log("[v0] ✅ Feedback stored successfully")
      }
    }

    console.log("[v0] ✅ Voice memo saved successfully")

    return NextResponse.json({
      success: true,
      transcript,
      status,
      message: "Voice memo successfully saved with transcription",
    })
  } catch (error) {
    console.error("[v0] ❌ Voice memo error:", error)
    return NextResponse.json({ error: "Failed to process voice memo" }, { status: 500 })
  }
}
