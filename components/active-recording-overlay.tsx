"use client"

interface ActiveRecordingOverlayProps {
  transcript: string
  onStop: () => void
}

export function ActiveRecordingOverlay({ transcript, onStop }: ActiveRecordingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-[#1a2332] border border-red-500/40 p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="h-4 w-4 rounded-full bg-red-600 animate-pulse mr-3" />
          <h2 className="text-2xl font-bold text-white">🎙️ Opptak pågår</h2>
        </div>

        {/* Live transcript */}
        <div className="min-h-[120px] rounded-xl bg-black/40 p-4 mb-8">
          <p className="text-xl text-white italic leading-relaxed">{transcript || "Snakk normalt…"}</p>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="w-full h-20 rounded-2xl bg-red-600 hover:bg-red-700
                     text-white text-2xl font-bold shadow-xl active:scale-95
                     transition-all"
        >
          AVSLUTT LOGGING
        </button>
      </div>
    </div>
  )
}
