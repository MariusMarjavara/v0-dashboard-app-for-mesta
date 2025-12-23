"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Trash2, Plus } from "lucide-react"

export function ContractAdminManager() {
  const [admins, setAdmins] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedContract, setSelectedContract] = useState("")
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [{ data: adminsData }, { data: usersData }, { data: contractsData }, { data: profilesData }] =
      await Promise.all([
        supabase.from("contract_admins").select("*"),
        supabase.from("profiles").select("*").eq("user_type", "ue"),
        supabase.from("contracts").select("*").order("nummer"),
        supabase.from("profiles").select("id, full_name, email"),
      ])

    // Join data manuelt
    const enrichedAdmins = (adminsData || []).map((admin) => {
      const profile = profilesData?.find((p) => p.id === admin.user_id)
      const contract = contractsData?.find((c) => c.nummer === admin.contract_nummer)
      return {
        ...admin,
        profiles: profile,
        contracts: contract,
      }
    })

    setAdmins(enrichedAdmins)
    setUsers(usersData || [])
    setContracts(contractsData || [])
    setLoading(false)
  }

  const addAdmin = async () => {
    if (!selectedUser || !selectedContract) return

    const { error } = await supabase.from("contract_admins").insert({
      user_id: selectedUser,
      contract_nummer: Number.parseInt(selectedContract),
    })

    if (!error) {
      loadData()
      setSelectedUser("")
      setSelectedContract("")
    }
  }

  const removeAdmin = async (id: string) => {
    const { error } = await supabase.from("contract_admins").delete().eq("id", id)

    if (!error) {
      loadData()
    }
  }

  if (loading) {
    return <div>Laster...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legg til kontraktsadministrator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Velg bruker...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>

            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Velg kontrakt...</option>
              {contracts.map((contract) => (
                <option key={contract.nummer} value={contract.nummer}>
                  {contract.nummer} - {contract.navn}
                </option>
              ))}
            </select>

            <Button onClick={addAdmin} disabled={!selectedUser || !selectedContract}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktive kontraktsadministratorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{admin.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {admin.contracts?.nummer} - {admin.contracts?.navn}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAdmin(admin.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Ingen administratorer registrert</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
