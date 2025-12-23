import { MestaLogo } from "@/components/mesta-logo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-mesta-navy flex flex-col items-center justify-center p-6">
      <MestaLogo className="mb-8" />

      <Card className="w-full max-w-md bg-mesta-navy-light border-border text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-white">Noe gikk galt</CardTitle>
        </CardHeader>
        <CardContent>
          {params?.error ? (
            <p className="text-sm text-muted-foreground mb-4">Feilkode: {params.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">En ukjent feil oppstod.</p>
          )}
          <Link href="/auth/login" className="text-mesta-orange hover:underline">
            Tilbake til innlogging
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
