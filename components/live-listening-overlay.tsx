"use client"

interface LiveListeningOverlayProps {
  transcript: string
}

export function LiveListeningOverlay({ transcript }: LiveListeningOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-[#1a2332] border border-red-500/40 p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="h-4 w-4 rounded-full bg-red-600 animate-pulse mr-3" />
          <h2 className="text-2xl font-bold text-white">Lytter…</h2>
        </div>

        <p className="text-lg text-gray-300 mb-4">Snakk normalt – jeg skriver mens du snakker</p>

        <div className="min-h-[80px] rounded-xl bg-black/40 p-4 text-left">
          <p className="text-xl text-white italic">{transcript || "…"}</p>
        </div>
      </div>
    </div>
  )
}
