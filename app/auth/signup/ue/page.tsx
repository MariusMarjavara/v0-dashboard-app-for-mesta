"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { MestaLogo } from "@/components/mesta-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContractSelector } from "@/components/contract-selector"
import type { ContractArea } from "@/lib/contract-areas"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function UESignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [contractArea, setContractArea] = useState("")
  const [selectedContract, setSelectedContract] = useState<ContractArea | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleContractChange = (value: string, contract: ContractArea | undefined) => {
    setContractArea(value)
    setSelectedContract(contract)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passordene stemmer ikke overens")
      setIsLoading(false)
      return
    }

    if (!contractArea) {
      setError("Du må velge en driftskontrakt")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            company: company,
            user_type: "ue",
            contract_area: contractArea,
            contract_area_id: selectedContract?.id,
            contract_name: selectedContract?.name,
            contract_nummer: selectedContract?.nummer,
            contract_type: selectedContract?.type,
            contract_region: selectedContract?.region,
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "En feil oppstod")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesta-navy flex flex-col items-center justify-center p-6">
      <MestaLogo className="mb-8" />

      <Card className="w-full max-w-md bg-mesta-navy-light border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Opprett UE-konto</CardTitle>
          <CardDescription className="text-muted-foreground">Registrer deg som underentreprenør</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">
                Fullt navn <span className="text-mesta-orange">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ola Nordmann"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                E-post <span className="text-mesta-orange">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="din.epost@firma.no"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-white">
                Firma <span className="text-mesta-orange">*</span>
              </Label>
              <Input
                id="company"
                type="text"
                placeholder="Ditt firma AS"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-secondary border-border text-white"
              />
            </div>

            <div className="border border-border rounded-lg p-4 bg-background/5">
              <h3 className="text-white font-medium mb-3">Velg driftskontrakt</h3>
              <ContractSelector value={contractArea} onChange={handleContractChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Passord <span className="text-mesta-orange">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeatPassword" className="text-white">
                Gjenta passord <span className="text-mesta-orange">*</span>
              </Label>
              <Input
                id="repeatPassword"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="bg-secondary border-border text-white"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Oppretter konto..." : "Opprett konto"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Er du Mesta-ansatt?{" "}
            <Link href="/auth/signup/mesta" className="text-mesta-orange hover:underline">
              Registrer deg her
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Har du allerede en konto?{" "}
            <Link href="/auth/login" className="text-mesta-orange hover:underline">
              Logg inn
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
