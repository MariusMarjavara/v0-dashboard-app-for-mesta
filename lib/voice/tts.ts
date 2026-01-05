let isSystemSpeaking = false

export function speak(text: string, onDone?: () => void) {
  if (!("speechSynthesis" in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "nb-NO"
  utterance.rate = 0.9
  utterance.pitch = 1

  utterance.onstart = () => {
    isSystemSpeaking = true
  }

  utterance.onend = () => {
    isSystemSpeaking = false
    onDone?.()
  }

  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

export function systemIsSpeaking() {
  return isSystemSpeaking
}
