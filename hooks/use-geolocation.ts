"use client"

import { useEffect, useState } from "react"

interface Geolocation {
  lat: number
  lon: number
  accuracy: number
}

export function useGeolocation() {
  const [location, setLocation] = useState<Geolocation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setError(null)
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { location, error }
}
