import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = (formData.get("file") as File) || (formData.get("audio") as File)

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const { experimental_transcribe } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const result = await experimental_transcribe({
      model: openai.transcription("gpt-4o-transcribe"),
      audio: audioFile,
      language: "no",
    })

    return NextResponse.json({
      transcript: result.text,
      text: result.text,
      confidence: result.confidence ?? null,
      language: result.language ?? "no",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Transcription failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
