import Link from "next/link"
import { MestaLogo } from "@/components/mesta-logo"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesta-navy flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/road-weather-split.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-mesta-navy/80 via-mesta-navy/70 to-mesta-navy/85" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-6">
          <MestaLogo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <span>Dashboard App</span>
          </nav>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">Mesta støtfangeren</h1>
          <p className="text-xl md:text-2xl text-mesta-orange font-semibold mb-12">Får folk fram.</p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <Button
              asChild
              size="lg"
              className="flex-1 bg-mesta-orange hover:bg-mesta-orange-hover text-white font-semibold text-lg py-6 rounded-lg"
            >
              <Link href="/auth/signup/mesta">Mesta Ansatt</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="flex-1 border-mesta-orange text-mesta-orange hover:bg-mesta-orange hover:text-white font-semibold text-lg py-6 rounded-lg bg-transparent"
            >
              <Link href="/auth/signup/ue">Underentreprenør</Link>
            </Button>
          </div>

          <p className="mt-6 text-white/60 text-sm">
            Har du allerede en konto?{" "}
            <Link href="/auth/login" className="text-mesta-orange hover:underline">
              Logg inn her
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
