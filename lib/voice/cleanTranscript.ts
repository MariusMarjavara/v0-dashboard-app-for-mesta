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

/**
 * Remove words that are repeated more than 3 times in a row
 * Example: "kjøpt kjøpt kjøpt kjøpt skruer" → "kjøpt skruer"
 */
function removeRepetitiveNoise(text: string): string {
  const words = text.split(/\s+/)
  const cleaned: string[] = []
  let lastWord = ""
  let repeatCount = 0

  for (const word of words) {
    if (word.toLowerCase() === lastWord.toLowerCase()) {
      repeatCount++
      // Only keep if repeated less than 3 times
      if (repeatCount < 3) {
        cleaned.push(word)
      }
    } else {
      cleaned.push(word)
      lastWord = word
      repeatCount = 0
    }
  }

  return cleaned.join(" ")
}

export function cleanTranscript(input: string) {
  let text = input.toLowerCase()

  // Remove system phrases
  for (const phrase of SYSTEM_PHRASES) {
    text = text.replaceAll(phrase, "")
  }

  // Clean extra whitespace
  text = text.replace(/\s+/g, " ").trim()

  // Remove repetitive noise
  text = removeRepetitiveNoise(text)

  return text
}
