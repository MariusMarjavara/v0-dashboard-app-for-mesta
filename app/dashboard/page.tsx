import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const userType = user.user_metadata?.user_type || "ue"
  const userName = user.user_metadata?.full_name || ""
  const contractArea = user.user_metadata?.contract_area || ""
  const contractAreaId = user.user_metadata?.contract_area_id || ""

  return (
    <DashboardContent
      userId={user.id}
      userName={userName}
      userType={userType}
      userEmail={user.email || ""}
      contractArea={contractArea}
      contractAreaId={contractAreaId}
    />
  )
}
