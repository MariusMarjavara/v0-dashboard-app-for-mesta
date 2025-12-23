import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VoiceMemosContent } from "@/components/voice-memos-content"

export default async function VoiceMemosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <VoiceMemosContent userId={user.id} />
}
