export function MestaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
        {/* Wind lines - left side */}
        <path d="M15 25 L35 25" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 40 L32 40" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 55 L35 55" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />

        {/* Snowflake - main structure */}
        <g transform="translate(60, 50)">
          {/* Center vertical line */}
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#5b8a9f" strokeWidth="4" strokeLinecap="round" />
          {/* Horizontal line */}
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#5b8a9f" strokeWidth="4" strokeLinecap="round" />
          {/* Diagonal lines */}
          <line x1="-16" y1="-16" x2="16" y2="16" stroke="#5b8a9f" strokeWidth="4" strokeLinecap="round" />
          <line x1="-16" y1="16" x2="16" y2="-16" stroke="#5b8a9f" strokeWidth="4" strokeLinecap="round" />

          {/* Snowflake branches - top */}
          <line x1="0" y1="-22" x2="-5" y2="-16" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          <line x1="0" y1="-22" x2="5" y2="-16" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          {/* bottom */}
          <line x1="0" y1="22" x2="-5" y2="16" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          <line x1="0" y1="22" x2="5" y2="16" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          {/* left */}
          <line x1="-22" y1="0" x2="-16" y2="-5" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          <line x1="-22" y1="0" x2="-16" y2="5" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          {/* right */}
          <line x1="22" y1="0" x2="16" y2="-5" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="0" x2="16" y2="5" stroke="#5b8a9f" strokeWidth="3" strokeLinecap="round" />
          {/* diagonal branches */}
          <line x1="-16" y1="-16" x2="-20" y2="-12" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-16" y1="-16" x2="-12" y2="-20" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="20" y2="12" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="12" y2="20" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-16" y1="16" x2="-20" y2="12" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-16" y1="16" x2="-12" y2="20" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="-16" x2="20" y2="-12" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="-16" x2="12" y2="-20" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />

          {/* Center orange diamond */}
          <rect x="-5" y="-5" width="10" height="10" fill="#ff6600" transform="rotate(45)" />

          {/* Orange upward arrow from diamond */}
          <path
            d="M 0 -5 Q 8 -15, 12 -22 L 10 -20 M 12 -22 L 14 -20"
            stroke="#ff6600"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Wind lines - right side */}
        <path d="M85 25 L105 25" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M88 40 L112 40" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M85 55 L108 55" stroke="#5b8a9f" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white tracking-tight">Støtfangeren</span>
        <span className="text-xs text-orange-500 uppercase tracking-widest">Vær- og Veioversikt</span>
      </div>
    </div>
  )
}
