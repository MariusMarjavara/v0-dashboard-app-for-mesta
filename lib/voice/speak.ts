export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("[v0] 🔇 Speech synthesis not available")
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "nb-NO"
  utterance.rate = 0.9
  utterance.pitch = 1

  window.speechSynthesis.speak(utterance)
  console.log("[v0] 🔊 Speaking:", text)
}
