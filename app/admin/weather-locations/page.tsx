"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ArrowLeft, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  contract_nummer: number
  name: string
  lat: number
  lon: number
  location_type: string
  priority: number
}

interface Contract {
  nummer: number
  navn: string
}

export default function WeatherLocationsPage() {
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<number | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [newLocation, setNewLocation] = useState({
    name: "",
    lat: "",
    lon: "",
    location_type: "city",
    priority: "50",
  })
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadContracts()
  }, [])

  useEffect(() => {
    if (selectedContract) {
      loadLocations()
    }
  }, [selectedContract])

  const loadContracts = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        router.push("/login")
        return
      }

      // Hent kontrakter som brukeren er admin for
      const { data: adminContracts } = await supabase
        .from("contract_admins")
        .select("contract_nummer, contracts(nummer, navn)")
        .eq("user_id", user.user.id)

      if (adminContracts) {
        const contractList = adminContracts.map((ac: any) => ac.contracts).filter(Boolean)
        setContracts(contractList)
        if (contractList.length > 0) {
          setSelectedContract(contractList[0].nummer)
        }
      }
    } catch (error) {
      console.error("Error loading contracts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async () => {
    if (!selectedContract) return

    try {
      const { data, error } = await supabase
        .from("contract_locations")
        .select("*")
        .eq("contract_nummer", selectedContract)
        .order("priority", { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error("Error loading locations:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke laste lokasjoner",
        variant: "destructive",
      })
    }
  }

  const addLocation = async () => {
    if (!selectedContract || !newLocation.name || !newLocation.lat || !newLocation.lon) {
      toast({
        title: "Manglende informasjon",
        description: "Fyll ut alle feltene",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("contract_locations").insert({
        contract_nummer: selectedContract,
        name: newLocation.name,
        lat: Number.parseFloat(newLocation.lat),
        lon: Number.parseFloat(newLocation.lon),
        location_type: newLocation.location_type,
        priority: Number.parseInt(newLocation.priority),
        source: "manual",
      })

      if (error) throw error

      toast({
        title: "Suksess",
        description: "Lokasjon lagt til",
      })

      setNewLocation({
        name: "",
        lat: "",
        lon: "",
        location_type: "city",
        priority: "50",
      })

      loadLocations()
    } catch (error) {
      console.error("Error adding location:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke legge til lokasjon",
        variant: "destructive",
      })
    }
  }

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase.from("contract_locations").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Suksess",
        description: "Lokasjon slettet",
      })

      loadLocations()
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke slette lokasjon",
        variant: "destructive",
      })
    }
  }

  const updatePriority = async (id: string, priority: number) => {
    try {
      const { error } = await supabase.from("contract_locations").update({ priority }).eq("id", id)

      if (error) throw error

      loadLocations()
    } catch (error) {
      console.error("Error updating priority:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <p>Laster...</p>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til admin
        </Button>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Ingen tilgang</CardTitle>
            <CardDescription>Du er ikke administrator for noen kontrakter</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til admin
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Administrer værlokasjoner</CardTitle>
          <CardDescription>Legg til eller fjern steder som vises i værkortene for din kontrakt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Velg kontrakt</Label>
              <Select
                value={selectedContract?.toString() || ""}
                onValueChange={(val) => setSelectedContract(Number.parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kontrakt" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.nummer} value={contract.nummer.toString()}>
                      {contract.nummer} - {contract.navn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedContract && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Legg til ny lokasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Stedsnavn</Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="F.eks. Tromsø"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newLocation.location_type}
                      onValueChange={(val) => setNewLocation({ ...newLocation, location_type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">By</SelectItem>
                        <SelectItem value="town">Tettsted</SelectItem>
                        <SelectItem value="village">Bygd</SelectItem>
                        <SelectItem value="weather_station">Værstasjon</SelectItem>
                        <SelectItem value="poi">Interessepunkt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="lat">Breddegrad</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={newLocation.lat}
                      onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                      placeholder="69.6492"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lon">Lengdegrad</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.000001"
                      value={newLocation.lon}
                      onChange={(e) => setNewLocation({ ...newLocation, lon: e.target.value })}
                      placeholder="18.9553"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioritet</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newLocation.priority}
                      onChange={(e) => setNewLocation({ ...newLocation, priority: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                </div>
                <Button onClick={addLocation} className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til lokasjon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eksisterende lokasjoner ({locations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <p className="text-muted-foreground">Ingen lokasjoner lagt til enda</p>
              ) : (
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {location.lat.toFixed(4)}, {location.lon.toFixed(4)} • Prioritet: {location.priority}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={location.priority}
                          onChange={(e) => updatePriority(location.id, Number.parseInt(e.target.value))}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLocation(location.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
