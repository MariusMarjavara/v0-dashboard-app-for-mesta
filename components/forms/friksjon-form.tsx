"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Check } from "lucide-react"

const locations = ["Tanadalen", "Varangerbotn", "Vardø", "Gandvik", "Kirkenes"]
const tiltakOptions = ["Salting", "Strøing", "Brøyting", "Kombinasjon"]

interface FriksjonFormProps {
  userName: string
  userId: string | null
  contractArea: string
  contractNummer: number | null
  onBack: () => void
  onSuccess: () => void
}

interface FriksjonFormState {
  hasRunToday: "" | "ja" | "nei"
  whyNot: string
  location: string
  lowestFriction: string
  generalFriction: string
  startTiltak: "" | "ja" | "nei"
  tiltak: string[]
}

export function FriksjonForm({ userName, userId, contractArea, contractNummer, onBack, onSuccess }: FriksjonFormProps) {
  const [form, setForm] = useState<FriksjonFormState>({
    hasRunToday: "",
    whyNot: "",
    location: "",
    lowestFriction: "",
    generalFriction: "",
    startTiltak: "",
    tiltak: [],
  })

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field: keyof FriksjonFormState) => (value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const supabase = createClient()

    await supabase.from("registrations").insert({
      user_id: userId,
      registered_by_name: userName,
      registration_type: "friksjon",
      contract_area: contractArea,
      contract_nummer: contractNummer,
      has_run_today: form.hasRunToday === "ja",
      why_not: form.hasRunToday === "nei" ? form.whyNot : null,
      location: form.hasRunToday === "ja" ? form.location : null,
      start_tiltak: form.hasRunToday === "ja" ? form.startTiltak === "ja" : null,
      tiltak: form.hasRunToday === "ja" && form.startTiltak === "ja" ? form.tiltak : null,
      lowest_friction: form.hasRunToday === "ja" ? Number(form.lowestFriction) : null,
      general_friction: form.hasRunToday === "ja" ? Number(form.generalFriction) : null,
      data: {}, // Keep for backwards compatibility
    })

    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tilbake
      </Button>

      <h2 className="text-2xl font-bold text-white">Friksjonsmålinger</h2>

      {step === 1 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Har du kjørt friksjonsmåling i dag?</Label>
          <RadioGroup value={form.hasRunToday} onValueChange={(v) => update("hasRunToday")(v)} className="space-y-3">
            {["ja", "nei"].map((v) => (
              <div key={v} className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
                <RadioGroupItem value={v} id={v} />
                <Label htmlFor={v} className="text-white cursor-pointer">
                  {v === "ja" ? "Ja" : "Nei"}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {form.hasRunToday === "nei" && (
            <div className="space-y-2 mt-4">
              <Label className="text-white">Hvorfor ikke?</Label>
              <Textarea
                value={form.whyNot}
                onChange={(e) => update("whyNot")(e.target.value)}
                placeholder="Beskriv årsaken..."
                className="bg-secondary border-border text-white"
              />
            </div>
          )}

          <Button
            onClick={() => (form.hasRunToday === "nei" ? handleSubmit() : setStep(2))}
            disabled={!form.hasRunToday || (form.hasRunToday === "nei" && !form.whyNot)}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            {form.hasRunToday === "nei" ? "Send inn" : "Neste"}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Hvor har du kjørt?</Label>
          <Select value={form.location} onValueChange={(v) => update("location")(v)}>
            <SelectTrigger className="bg-secondary border-border text-white">
              <SelectValue placeholder="Velg lokasjon" />
            </SelectTrigger>
            <SelectContent className="bg-mesta-navy-light border-border">
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-white">
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Laveste friksjonstall</Label>
              <Input
                type="number"
                step="0.01"
                value={form.lowestFriction}
                onChange={(e) => update("lowestFriction")(e.target.value)}
                placeholder="f.eks. 0.25"
                className="bg-secondary border-border text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Generelt friksjonstall</Label>
              <Input
                type="number"
                step="0.01"
                value={form.generalFriction}
                onChange={(e) => update("generalFriction")(e.target.value)}
                placeholder="f.eks. 0.45"
                className="bg-secondary border-border text-white"
              />
            </div>
          </div>

          <Button
            onClick={() => setStep(3)}
            disabled={!form.location || !form.lowestFriction || !form.generalFriction}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            Neste
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Settes tiltak igang?</Label>
          <RadioGroup value={form.startTiltak} onValueChange={(v) => update("startTiltak")(v)} className="space-y-3">
            {["ja", "nei"].map((v) => (
              <div key={v} className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
                <RadioGroupItem value={v} id={`tiltak-${v}`} />
                <Label htmlFor={`tiltak-${v}`} className="text-white cursor-pointer">
                  {v === "ja" ? "Ja" : "Nei"}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {form.startTiltak === "ja" && (
            <div className="space-y-2 mt-4">
              <Label className="text-white">Hvilke tiltak?</Label>
              <div className="grid grid-cols-2 gap-2">
                {tiltakOptions.map((tiltak) => (
                  <Button
                    key={tiltak}
                    type="button"
                    variant={form.tiltak.includes(tiltak) ? "default" : "outline"}
                    className={
                      form.tiltak.includes(tiltak)
                        ? "bg-mesta-orange text-white"
                        : "border-border text-white hover:bg-secondary"
                    }
                    onClick={() =>
                      update("tiltak")(
                        form.tiltak.includes(tiltak)
                          ? form.tiltak.filter((x) => x !== tiltak)
                          : [...form.tiltak, tiltak],
                      )
                    }
                  >
                    {form.tiltak.includes(tiltak) && <Check className="mr-1 h-4 w-4" />}
                    {tiltak}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!form.startTiltak || (form.startTiltak === "ja" && form.tiltak.length === 0) || isSubmitting}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            {isSubmitting ? "Sender..." : "Send inn registrering"}
          </Button>
        </div>
      )}
    </div>
  )
}
