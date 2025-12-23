"use client"

import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { contractAreas, contractTypes, getMestaContracts, type ContractArea } from "@/lib/contract-areas"
import { Badge } from "@/components/ui/badge"

interface ContractSelectorProps {
  value: string
  onChange: (value: string, contract: ContractArea | undefined) => void
  className?: string
  showMestaOnly?: boolean
}

export function ContractSelector({ value, onChange, className, showMestaOnly = false }: ContractSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedRegion, setSelectedRegion] = useState<string>("")

  const baseContracts = useMemo(() => {
    return showMestaOnly ? getMestaContracts() : contractAreas
  }, [showMestaOnly])

  // Filtrer kontrakter basert på valgt type og region
  const filteredContracts = useMemo(() => {
    return baseContracts.filter((c) => {
      if (selectedType && selectedType !== "all" && c.type !== selectedType) return false
      if (selectedRegion && selectedRegion !== "all" && c.region !== selectedRegion) return false
      return true
    })
  }, [baseContracts, selectedType, selectedRegion])

  // Hent tilgjengelige regioner basert på valgt type
  const availableRegions = useMemo(() => {
    const contracts =
      selectedType && selectedType !== "all" ? baseContracts.filter((c) => c.type === selectedType) : baseContracts
    return [...new Set(contracts.map((c) => c.region))].sort()
  }, [baseContracts, selectedType])

  const availableTypes = useMemo(() => {
    const types = [...new Set(baseContracts.map((c) => c.type))]
    return contractTypes.filter((t) => types.includes(t.id as any))
  }, [baseContracts])

  const handleContractChange = (contractId: string) => {
    const contract = contractAreas.find((c) => c.id === contractId)
    onChange(contractId, contract)
  }

  const selectedContract = contractAreas.find((c) => c.id === value)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Vegforvalter-filter */}
      <div className="space-y-2">
        <Label className="text-foreground text-sm">Kontraktstype</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue placeholder="Alle kontraktstyper" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-60">
            <SelectItem value="all" className="text-foreground">
              Alle kontraktstyper
            </SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type.id} value={type.id} className="text-foreground">
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region-filter */}
      <div className="space-y-2">
        <Label className="text-foreground text-sm">Region/Fylke</Label>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue placeholder="Alle regioner" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-60">
            <SelectItem value="all" className="text-foreground">
              Alle regioner
            </SelectItem>
            {availableRegions.map((region) => (
              <SelectItem key={region} value={region} className="text-foreground">
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kontraktsvalg */}
      <div className="space-y-2">
        <Label className="text-foreground">
          Driftskontrakt <span className="text-mesta-orange">*</span>
        </Label>
        <Select value={value} onValueChange={handleContractChange} required>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue placeholder="Velg driftskontrakt" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-72">
            {filteredContracts.length === 0 ? (
              <div className="px-3 py-2 text-muted-foreground text-sm">Ingen kontrakter funnet</div>
            ) : (
              filteredContracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id} className="text-foreground">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contract.name}</span>
                      {contract.entreprenor === "MESTA AS" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-mesta-orange text-mesta-orange"
                        >
                          Mesta
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {contract.entreprenor} • {contract.periode}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {filteredContracts.length} kontrakter tilgjengelig
          {showMestaOnly && " (kun Mesta)"}
        </p>
      </div>

      {selectedContract && (
        <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{selectedContract.name}</span>
            <Badge
              variant="outline"
              className={
                selectedContract.entreprenor === "MESTA AS"
                  ? "border-mesta-orange text-mesta-orange"
                  : "border-muted-foreground text-muted-foreground"
              }
            >
              {selectedContract.entreprenor === "MESTA AS" ? "Mesta" : "Ekstern"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Entreprenør: {selectedContract.entreprenor}</p>
            <p>Periode: {selectedContract.periode}</p>
            <p>Region: {selectedContract.region}</p>
          </div>
        </div>
      )}
    </div>
  )
}
