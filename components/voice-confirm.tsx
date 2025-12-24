"use client"

interface VoiceConfirmProps {
  summary: string
  onConfirm: () => void
}

export function VoiceConfirm({ summary, onConfirm }: VoiceConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-bold mb-6">Registrert</h2>
      <p className="text-xl text-center mb-12 max-w-md leading-relaxed">{summary}</p>

      <button
        onClick={onConfirm}
        className="bg-orange-600 hover:bg-orange-700 text-white text-3xl px-16 py-8 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform"
      >
        LAGRE
      </button>
    </div>
  )
}
