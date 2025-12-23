import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoleManager } from "@/components/role-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function RolesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Kun owner og superuser kan se denne siden
  if (!profile || !["owner", "superuser"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til admin
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Rolleadministrasjon</h1>
        <p className="text-muted-foreground">Administrer brukerroller og tilganger i systemet</p>
      </div>

      <RoleManager currentUserRole={profile.role} />
    </div>
  )
}
