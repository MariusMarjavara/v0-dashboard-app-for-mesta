import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] 🎙️ Transcribe API called")

    const formData = await req.formData()
    const audioFile = (formData.get("file") as File) || (formData.get("audio") as File)

    if (!audioFile) {
      console.log("[v0] ❌ No audio file provided")
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("[v0] 🎙️ Audio file received:", audioFile.name, audioFile.type, audioFile.size)

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.log("[v0] ⚠️ OPENAI_API_KEY not available, falling back to live transcript")
      return NextResponse.json(
        {
          transcript: null,
          error: "OpenAI API key not configured",
          fallbackRequired: true,
        },
        { status: 200 }, // Return 200 to trigger fallback gracefully
      )
    }

    const OpenAI = (await import("openai")).default
    const openai = new OpenAI({ apiKey })

    console.log("[v0] 🎙️ Calling OpenAI Whisper API")

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "no",
      response_format: "verbose_json",
    })

    console.log("[v0] ✅ Transcription successful:", transcription.text)

    return NextResponse.json({
      transcript: transcription.text,
      text: transcription.text,
      confidence: null,
      language: transcription.language ?? "no",
    })
  } catch (error: any) {
    console.error("[v0] ❌ Transcription error:", error.message)
    return NextResponse.json(
      {
        transcript: null,
        error: error.message,
        fallbackRequired: true,
      },
      { status: 200 },
    )
  }
}
