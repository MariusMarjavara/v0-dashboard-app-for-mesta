import Link from "next/link"
import { MestaLogo } from "@/components/mesta-logo"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesta-navy flex flex-col">
      <div className="relative flex-1 flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/road-weather-split.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-mesta-navy/85 via-mesta-navy/75 to-mesta-navy/90" />
        </div>

        <header className="relative z-10 flex items-center justify-between p-6">
          <MestaLogo />
          <nav className="hidden md:flex items-center gap-6 text-base text-white/80 font-medium">
            <span>Dashboard App</span>
          </nav>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance leading-tight">
            Mesta støtfangeren
          </h1>
          <p className="text-2xl md:text-3xl text-primary font-bold mb-16">Får folk fram.</p>

          <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
            <Button
              asChild
              size="lg"
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-xl py-7 rounded-xl shadow-[0_6px_20px_rgba(243,112,33,0.5)] hover:shadow-[0_8px_24px_rgba(243,112,33,0.6)] transition-all hover:scale-105"
            >
              <Link href="/auth/signup/mesta">Mesta Ansatt</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-xl py-7 rounded-xl bg-transparent/10 backdrop-blur-sm transition-all hover:scale-105"
            >
              <Link href="/auth/signup/ue">Underentreprenør</Link>
            </Button>
          </div>

          <p className="mt-8 text-white/70 text-base">
            Har du allerede en konto?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              Logg inn her
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
