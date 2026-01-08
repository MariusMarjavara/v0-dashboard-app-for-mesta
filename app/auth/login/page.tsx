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
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe, // Session stored if true, only in memory if false
        },
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "En feil oppstod")
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/road-weather-split.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <MestaLogo className="mb-10" />

        <Card className="w-full max-w-md bg-card/90 backdrop-blur-md border-2 border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold text-white">Logg inn</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-3">
              Skriv inn din e-post og passord for å logge inn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold text-base">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din.epost@mesta.no"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/80 border-2 border-border text-white placeholder:text-muted-foreground h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-semibold text-base">
                  Passord
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/80 border-2 border-border text-white placeholder:text-muted-foreground h-12 text-base"
                />
              </div>
              <label className="flex items-center gap-3 text-base text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-5 w-5 accent-primary cursor-pointer"
                />
                <span className="font-medium">Forbli innlogget</span>
              </label>
              {rememberMe && <p className="text-sm text-muted-foreground">Ikke bruk dette på delte enheter</p>}
              {error && (
                <p className="text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-lg shadow-[0_4px_16px_rgba(243,112,33,0.4)] hover:shadow-[0_6px_20px_rgba(243,112,33,0.5)] transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Logger inn..." : "Logg inn"}
              </Button>
            </form>
            <div className="mt-6 text-center text-base text-muted-foreground">
              Har du ikke en konto?{" "}
              <Link href="/" className="text-primary hover:underline font-semibold">
                Registrer deg
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
