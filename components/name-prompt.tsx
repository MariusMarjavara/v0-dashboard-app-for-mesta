"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NamePromptProps {
  onSubmit: (name: string) => void
}

export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <Card className="bg-mesta-navy-light border-border">
      <CardHeader>
        <CardTitle className="text-white">Hvem registrerer?</CardTitle>
        <CardDescription className="text-muted-foreground">
          Vennligst skriv inn ditt navn for å fortsette
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Ditt navn
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ola Nordmann"
              className="bg-secondary border-border text-white"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
            disabled={!name.trim()}
          >
            Fortsett
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
