export interface VoiceSession {
  audio: Blob
  transcript: string
  interpretation: {
    type: string
    confidence: number
    extracted: Record<string, any>
    summary: string
    schema: any
    fieldConfidence: Record<string, "high" | "suggested" | "missing">
    missingRequired: string[]
  }
}
