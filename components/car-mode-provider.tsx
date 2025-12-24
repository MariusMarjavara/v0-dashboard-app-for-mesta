"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface CarModeContextType {
  carMode: boolean
  toggleCarMode: () => void
}

const CarModeContext = createContext<CarModeContextType>({
  carMode: true,
  toggleCarMode: () => {},
})

export const CAR_MODE_RULES = {
  allowTextInput: false,
  allowDropdowns: false,
  requireVoice: true,
  requireLongPress: true,
  longPressMs: 600,
  hapticFeedback: true,
}

export function CarModeProvider({ children }: { children: React.ReactNode }) {
  const [carMode, setCarMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("carMode")
    if (saved !== null) {
      setCarMode(saved === "true")
    }
  }, [])

  const toggleCarMode = () => {
    setCarMode((v) => {
      const newValue = !v
      localStorage.setItem("carMode", String(newValue))
      return newValue
    })
  }

  return <CarModeContext.Provider value={{ carMode, toggleCarMode }}>{children}</CarModeContext.Provider>
}

export const useCarMode = () => useContext(CarModeContext)

export const useCarModeInputCheck = () => {
  const { carMode } = useCarMode()
  return {
    shouldDisableTextInput: carMode && !CAR_MODE_RULES.allowTextInput,
    shouldDisableDropdown: carMode && !CAR_MODE_RULES.allowDropdowns,
    requireVoiceInput: carMode && CAR_MODE_RULES.requireVoice,
  }
}
