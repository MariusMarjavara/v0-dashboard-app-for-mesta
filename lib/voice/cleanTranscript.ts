const SYSTEM_PHRASES = [
  "jeg hører deg",
  "jeg hører",
  "tolker det du sa",
  "se gjennom før lagring",
  "jeg er ferdig med å tolke",
  "gir tilbakemelding",
  "takk",
  "lytter",
]

export function cleanTranscript(input: string) {
  let text = input.toLowerCase()

  for (const phrase of SYSTEM_PHRASES) {
    text = text.replaceAll(phrase, "")
  }

  return text.replace(/\s+/g, " ").trim()
}
