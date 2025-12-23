"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCog, Users, UserIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Profile {
  id: string
  full_name: string
  email: string
  company: string
  user_type: string
  role: string
  contract_area: string | null
}

const roleConfig = {
  owner: {
    label: "Eier",
    icon: Shield,
    color: "bg-purple-500",
    description: "Full tilgang, kan tildele alle roller",
  },
  superuser: {
    label: "Superbruker",
    icon: UserCog,
    color: "bg-blue-500",
    description: "Kan tildele administrator-rettigheter",
  },
  admin: {
    label: "Administrator",
    icon: Users,
    color: "bg-green-500",
    description: "Kan administrere kontrakter",
  },
  user: {
    label: "Bruker",
    icon: UserIcon,
    color: "bg-gray-500",
    description: "Standard tilgang",
  },
}

export function RoleManager({ currentUserRole }: { currentUserRole: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role", { ascending: true })
      .order("full_name", { ascending: true })

    if (error) {
      console.error("[v0] Error loading profiles:", error)
      toast.error("Kunne ikke laste brukere")
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  async function updateRole(userId: string, newRole: string) {
    setUpdating(userId)

    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

    if (error) {
      console.error("[v0] Error updating role:", error)
      toast.error("Kunne ikke oppdatere rolle")
    } else {
      toast.success("Rolle oppdatert")
      loadProfiles()
    }
    setUpdating(null)
  }

  function canChangeRole(targetRole: string): boolean {
    if (currentUserRole === "owner") {
      return true // Owner kan endre alle roller
    }
    if (currentUserRole === "superuser") {
      return ["user", "admin"].includes(targetRole) // Superuser kan kun endre user og admin
    }
    return false
  }

  function getAvailableRoles(currentRole: string): string[] {
    if (currentUserRole === "owner") {
      return ["owner", "superuser", "admin", "user"]
    }
    if (currentUserRole === "superuser") {
      if (["owner", "superuser"].includes(currentRole)) {
        return [] // Kan ikke endre owner eller superuser
      }
      return ["admin", "user"]
    }
    return []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rolleoversikt */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon
          const count = profiles.filter((p) => p.role === role).length
          return (
            <Card key={role}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <CardDescription className="text-sm">{config.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Brukertabell */}
      <Card>
        <CardHeader>
          <CardTitle>Alle brukere</CardTitle>
          <CardDescription>
            {currentUserRole === "owner"
              ? "Du kan tildele alle roller som eier"
              : "Du kan tildele administrator-rettigheter som superbruker"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Kontrakt</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const Icon = roleConfig[profile.role as keyof typeof roleConfig]?.icon || UserIcon
                const availableRoles = getAvailableRoles(profile.role)
                const canEdit = availableRoles.length > 0 && canChangeRole(profile.role)

                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{profile.user_type === "mesta" ? "Mesta" : "UE"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{profile.contract_area || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{roleConfig[profile.role as keyof typeof roleConfig]?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <Select
                          value={profile.role}
                          onValueChange={(value) => updateRole(profile.id, value)}
                          disabled={updating === profile.id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleConfig[role as keyof typeof roleConfig]?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">Ingen tilgang</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
