"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"

interface InnkjopFormProps {
  userName: string
  userId: string | null
  contractArea: string
  contractNummer: number | null
  onBack: () => void
  onSuccess: () => void
}

interface InnkjopFormState {
  product: string
  amount: string
  price: string
  comment: string
}

export function InnkjopForm({ userName, userId, contractArea, contractNummer, onBack, onSuccess }: InnkjopFormProps) {
  const [form, setForm] = useState<InnkjopFormState>({
    product: "",
    amount: "",
    price: "",
    comment: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField =
    (field: keyof InnkjopFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const supabase = createClient()

    await supabase.from("registrations").insert({
      user_id: userId,
      registered_by_name: userName,
      registration_type: "innkjop",
      contract_area: contractArea,
      contract_nummer: contractNummer,
      product: form.product,
      amount: Number(form.amount),
      price: Number(form.price),
      comment: form.comment || null,
      data: {
        product: form.product,
        amount: Number(form.amount),
        price: Number(form.price),
        comment: form.comment,
      },
    })

    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake
      </Button>

      <h2 className="text-2xl font-bold text-white">Innkjøp</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Produkt</Label>
          <Input
            value={form.product}
            onChange={updateField("product")}
            placeholder="Hva er kjøpt?"
            className="bg-secondary border-border text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Antall</Label>
          <Input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={updateField("amount")}
            placeholder="0"
            className="bg-secondary border-border text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Pris (kr)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={updateField("price")}
            placeholder="0.00"
            className="bg-secondary border-border text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Kommentar</Label>
          <Textarea
            value={form.comment}
            onChange={updateField("comment")}
            placeholder="Valgfritt"
            className="bg-secondary border-border text-white"
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!form.product || !form.amount || !form.price || isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? "Sender..." : "Send inn registrering"}
        </Button>
      </div>
    </div>
  )
}
