"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"

const machineTypes = [
  { id: "wille675", name: "Wille 675" },
  { id: "hjulgraver", name: "Hjulgraver Volvo" },
  { id: "annen", name: "Annen maskin" },
]

interface MaskinFormProps {
  userName: string
  userId: string | null
  contractArea: string
  contractNummer: number | null
  onBack: () => void
  onSuccess: () => void
}

export function MaskinForm({ userName, userId, contractArea, contractNummer, onBack, onSuccess }: MaskinFormProps) {
  const [step, setStep] = useState(1)
  const [needsSupplies, setNeedsSupplies] = useState<string>("")
  const [whatMissing, setWhatMissing] = useState("")
  const [howMuch, setHowMuch] = useState("")
  const [selectedMachine, setSelectedMachine] = useState("")
  const [customMachine, setCustomMachine] = useState("")
  const [dailyMaintenance, setDailyMaintenance] = useState<string>("")
  const [hoursWorked, setHoursWorked] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const supabase = createClient()

    const data = {
      needs_supplies: needsSupplies === "ja",
      what_missing: needsSupplies === "ja" ? whatMissing : null,
      how_much: needsSupplies === "ja" ? howMuch : null,
      machine_type: selectedMachine === "annen" ? customMachine : selectedMachine,
      daily_maintenance_done: dailyMaintenance === "ja",
      hours_worked: Number.parseFloat(hoursWorked),
    }

    await supabase.from("registrations").insert({
      user_id: userId,
      registered_by_name: userName,
      registration_type: "maskin",
      contract_area: contractArea,
      contract_nummer: contractNummer,
      data,
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

      <h2 className="text-2xl font-bold text-white">Maskinoppfølgning</h2>

      {step === 1 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Mangler det forbruksvarer?</Label>
          <RadioGroup value={needsSupplies} onValueChange={setNeedsSupplies} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
              <RadioGroupItem value="nei" id="supplies-nei" />
              <Label htmlFor="supplies-nei" className="text-white cursor-pointer">
                Nei
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
              <RadioGroupItem value="ja" id="supplies-ja" />
              <Label htmlFor="supplies-ja" className="text-white cursor-pointer">
                Ja
              </Label>
            </div>
          </RadioGroup>

          {needsSupplies === "ja" && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white">Hva mangler?</Label>
                <Textarea
                  value={whatMissing}
                  onChange={(e) => setWhatMissing(e.target.value)}
                  placeholder="Beskriv hva som mangler..."
                  className="bg-secondary border-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Hvor mye trenger vi?</Label>
                <Input
                  value={howMuch}
                  onChange={(e) => setHowMuch(e.target.value)}
                  placeholder="Antall/mengde"
                  className="bg-secondary border-border text-white"
                />
              </div>
            </div>
          )}

          <Button
            onClick={() => setStep(2)}
            disabled={!needsSupplies || (needsSupplies === "ja" && (!whatMissing || !howMuch))}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            Neste
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Velg maskin</Label>
          <RadioGroup value={selectedMachine} onValueChange={setSelectedMachine} className="space-y-3">
            {machineTypes.map((machine) => (
              <div key={machine.id} className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
                <RadioGroupItem value={machine.id} id={machine.id} />
                <Label htmlFor={machine.id} className="text-white cursor-pointer">
                  {machine.name}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedMachine === "annen" && (
            <div className="space-y-2 mt-4">
              <Label className="text-white">Hvilken maskin?</Label>
              <Input
                value={customMachine}
                onChange={(e) => setCustomMachine(e.target.value)}
                placeholder="Skriv inn maskintype"
                className="bg-secondary border-border text-white"
              />
            </div>
          )}

          <Button
            onClick={() => setStep(3)}
            disabled={!selectedMachine || (selectedMachine === "annen" && !customMachine)}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            Neste
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Daglig vedlikehold utført?</Label>
          <RadioGroup value={dailyMaintenance} onValueChange={setDailyMaintenance} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
              <RadioGroupItem value="ja" id="maint-ja" />
              <Label htmlFor="maint-ja" className="text-white cursor-pointer">
                Ja
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
              <RadioGroupItem value="nei" id="maint-nei" />
              <Label htmlFor="maint-nei" className="text-white cursor-pointer">
                Nei
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label className="text-white">Timeverk på maskin</Label>
            <Input
              type="number"
              step="0.5"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="Antall timer"
              className="bg-secondary border-border text-white"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!dailyMaintenance || !hoursWorked || isSubmitting}
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
          >
            {isSubmitting ? "Sender..." : "Send inn registrering"}
          </Button>
        </div>
      )}
    </div>
  )
}
