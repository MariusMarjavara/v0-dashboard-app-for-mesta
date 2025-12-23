import { MestaLogo } from "@/components/mesta-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-mesta-navy flex flex-col items-center justify-center p-6">
      <MestaLogo className="mb-8" />

      <Card className="w-full max-w-md bg-mesta-navy-light border-border text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-mesta-orange" />
          </div>
          <CardTitle className="text-2xl text-white">Takk for registreringen!</CardTitle>
          <CardDescription className="text-muted-foreground">Din konto er nå opprettet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Du kan nå logge inn og begynne å bruke systemet.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-mesta-orange hover:bg-mesta-orange-hover text-white rounded-lg transition-colors"
          >
            Gå til innlogging
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
