export function calculateOperationalStatus(data: {
  transcript: string
  hendelse?: string
  tiltak?: string
  vakttlf?: boolean
}): string {
  const { transcript, hendelse, tiltak } = data
  const lower = transcript.toLowerCase()

  // Kritisk status
  if (hendelse === "Ulykke" || lower.includes("ulykke")) {
    return "ULYKKE - ØKT BEREDSKAP"
  }

  if (hendelse === "Stengt vei" || lower.includes("stengt") || lower.includes("sperret")) {
    return "VEI STENGT"
  }

  // Varsling
  if (hendelse === "Glatt vei" || tiltak === "Strøing" || lower.includes("glatt") || lower.includes("is")) {
    return "STRØING ANBEFALES"
  }

  if (tiltak === "Brøyting" || lower.includes("snø") || lower.includes("brøyt")) {
    return "BRØYTING ANBEFALES"
  }

  if (hendelse === "Dårlig sikt" || lower.includes("sikt")) {
    return "OBS - DÅRLIG SIKT"
  }

  // Normal drift
  return "NORMAL DRIFT"
}
