"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MapPin, Clock, Edit2, Check } from "lucide-react"
import Image from "next/image"

interface ImageCardProps {
  id: string
  previewUrl: string
  roadReference: string
  timestamp: string
  onRemove: (id: string) => void
  onUpdateReference: (id: string, reference: string) => void
}

export function ImageCard({ id, previewUrl, roadReference, timestamp, onRemove, onUpdateReference }: ImageCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempReference, setTempReference] = useState(roadReference)

  const handleSave = () => {
    onUpdateReference(id, tempReference)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempReference(roadReference)
    setIsEditing(false)
  }

  return (
    <div className="bg-[#1a2332] rounded-lg overflow-hidden border border-[#2a3442]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Image section */}
        <div className="relative aspect-video">
          <Image src={previewUrl || "/placeholder.svg"} alt="Arbeidsbilde" fill className="object-cover" unoptimized />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-red-600 hover:bg-red-700"
            onClick={() => onRemove(id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Info section */}
        <div className="p-4 flex flex-col justify-between space-y-3">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>{timestamp}</span>
          </div>

          {/* Road reference */}
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={tempReference}
                      onChange={(e) => setTempReference(e.target.value)}
                      placeholder="Legg til vegreferanse"
                      className="bg-[#0f1419] border-[#2a3442] text-white placeholder:text-gray-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Lagre
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="border-[#2a3442] text-gray-300 hover:bg-[#0f1419] bg-transparent"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white break-all">{roadReference || "Ingen vegreferanse"}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="text-orange-500 hover:text-orange-400 hover:bg-[#0f1419] shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
