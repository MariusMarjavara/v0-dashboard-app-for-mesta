import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function enrichRegistrationAsync(registrationId: string, transcript: string, metadata: any) {
  try {
    const supabase = await createClient()

    // Import heavy dependencies only when needed
    const { calculateOperationalStatus } = await import("@/lib/operational-status")
    const { classifyVoiceTranscript } = await import("@/lib/voice/classify")

    console.log("[v0] 🔄 Starting async enrichment for registration:", registrationId)

    // Perform heavy operations asynchronously
    const classification = classifyVoiceTranscript(transcript)
    const status = calculateOperationalStatus({
      transcript,
      hendelse: metadata.extracted?.hendelse,
      tiltak: metadata.extracted?.tiltak,
      vakttlf: metadata.extracted?.vakttlf,
    })

    // Update registration with enriched data
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        data: {
          ...metadata.extracted,
          operativ_status: status,
          classification: {
            type: classification.registration_type,
            subcategory: classification.subcategory,
            confidence: classification.confidence,
            keywords: classification.keywords,
          },
          enriched_at: new Date().toISOString(),
        },
        registration_type: classification.registration_type,
      })
      .eq("id", registrationId)

    if (updateError) {
      console.error("[v0] ⚠️ Enrichment update failed (non-critical):", updateError)
    } else {
      console.log("[v0] ✅ Async enrichment completed for:", registrationId)
    }
  } catch (error) {
    console.error("[v0] ⚠️ Async enrichment failed (non-critical):", error)
    // Don't throw - enrichment failure should not block the user
  }
}

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

    const supabase = await createClient()

    const row = {
      user_id: metadata.userId,
      registered_by_name: metadata.userName,
      registration_type: "voice_memo", // Default type before enrichment
      contract_area: metadata.contractArea,
      contract_nummer: metadata.contractNummer,
      lat: metadata.gps?.lat || null,
      lon: metadata.gps?.lon || null,
      data: {
        // Raw snapshot data
        transcript,
        timestamp: metadata.timestamp,
        source: "voice" as const,
        confidence: metadata.confidence || {},
        // Store extracted fields but mark as pending enrichment
        ...metadata.extracted,
        enrichment_status: "pending",
      },
    }

    console.log("[v0] 🧠 Inserting snapshot into database")

    const { data: insertedData, error: dbError } = await supabase
      .from("registrations")
      .insert(row)
      .select("id")
      .single()

    if (dbError) {
      console.error("[v0] ❌ Database error:", dbError)
      throw new Error("Database insert failed")
    }

    const registrationId = insertedData.id
    console.log("[v0] ✅ Snapshot saved with ID:", registrationId)

    // This runs in the background without blocking the response
    enrichRegistrationAsync(registrationId, transcript, metadata).catch((error) => {
      console.error("[v0] ⚠️ Async enrichment trigger failed:", error)
      // Don't throw - enrichment is optional
    })

    if (metadata.feedback && metadata.feedback.predicted_type !== metadata.feedback.corrected_type) {
      console.log("[v0] 📚 Storing classification feedback (async)")

      supabase
        .from("voice_classification_feedback")
        .insert({
          transcript: transcript,
          predicted_type: metadata.feedback.predicted_type,
          corrected_type: metadata.feedback.corrected_type,
          user_id: metadata.userId,
        })
        .then(({ error: feedbackError }) => {
          if (feedbackError) {
            console.error("[v0] ⚠️ Feedback storage failed (non-critical):", feedbackError)
          } else {
            console.log("[v0] ✅ Feedback stored successfully")
          }
        })
        .catch((err) => {
          console.error("[v0] ⚠️ Feedback storage error:", err)
        })
    }

    console.log("[v0] ✅ Voice memo snapshot saved, enrichment in progress")

    return NextResponse.json({
      success: true,
      id: registrationId,
      transcript,
      message: "Voice memo successfully saved",
    })
  } catch (error) {
    console.error("[v0] ❌ Voice memo error:", error)
    return NextResponse.json({ error: "Failed to process voice memo" }, { status: 500 })
  }
}
