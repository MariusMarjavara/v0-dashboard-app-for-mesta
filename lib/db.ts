import { createClient } from "@/lib/supabase/server"

export async function getLogs(from: string, to: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .eq("registration_type", "voice_memo")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Database error:", error)
    return []
  }

  return data || []
}

export async function getRegistrations(userId?: string, contractNummer?: number, registrationType?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("registrations")
    .select("*, profiles!inner(full_name, email)")
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  if (contractNummer) {
    query = query.eq("contract_nummer", contractNummer)
  }

  if (registrationType) {
    query = query.eq("registration_type", registrationType)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Database error:", error)
    return []
  }

  return data || []
}
