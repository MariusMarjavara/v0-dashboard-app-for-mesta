"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { MestaLogo } from "@/components/mesta-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "En feil oppstod")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/road-weather-split.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-mesta-navy/85 via-mesta-navy/80 to-mesta-navy/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <MestaLogo className="mb-8" />

        <Card className="w-full max-w-md bg-mesta-navy-light border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Logg inn</CardTitle>
            <CardDescription className="text-muted-foreground">
              Skriv inn din e-post og passord for å logge inn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din.epost@mesta.no"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Passord
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Logger inn..." : "Logg inn"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Har du ikke en konto?{" "}
              <Link href="/" className="text-mesta-orange hover:underline">
                Registrer deg
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
