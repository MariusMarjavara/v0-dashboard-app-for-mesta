import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContractAdminManager } from "@/components/contract-admin-manager"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Shield, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.user_type !== "mesta" && !["owner", "superuser"].includes(profile.role))) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til dashboard
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Administrasjon</h1>
        <p className="text-muted-foreground">Administrer kontraktsadministratorer og tilganger</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {["owner", "superuser"].includes(profile.role) && (
          <>
            <Link href="/admin/roles">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rolleadministrasjon
                  </CardTitle>
                  <CardDescription>Administrer brukerroller og tilganger</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/audit">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Revisjonslogg
                  </CardTitle>
                  <CardDescription>Se alle endringer i systemet for etterprøvbarhet</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </>
        )}
        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kontraktsadministratorer
            </CardTitle>
            <CardDescription>Administrer hvem som er administrator for hver kontrakt</CardDescription>
          </CardHeader>
        </Card>
        <Link href="/admin/weather-locations">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Værlokasjoner
              </CardTitle>
              <CardDescription>Administrer hvilke steder som vises i værkortene</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <ContractAdminManager />
    </div>
  )
}
