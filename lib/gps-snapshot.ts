export interface GpsSnapshot {
  lat: number
  lon: number
  accuracy: number
  captured_at: string
}

export interface GpsError {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN"
  message: string
}

export async function getGpsSnapshot(): Promise<{ gps: GpsSnapshot } | { error: GpsError }> {
  if (!("geolocation" in navigator)) {
    return {
      error: {
        code: "POSITION_UNAVAILABLE",
        message: "GPS er ikke tilgjengelig på denne enheten",
      },
    }
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })

    return {
      gps: {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        captured_at: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    let code: GpsError["code"] = "UNKNOWN"
    let message = "Kunne ikke hente GPS-posisjon"

    if (error.code === 1) {
      code = "PERMISSION_DENIED"
      message = "GPS-tilgang er blokkert. Aktiver posisjonstillatelse i nettleserinnstillinger."
    } else if (error.code === 2) {
      code = "POSITION_UNAVAILABLE"
      message = "GPS-signalet er for svakt. Gå utenfor eller nærmere vindu."
    } else if (error.code === 3) {
      code = "TIMEOUT"
      message = "GPS-lokalisering tok for lang tid. Prøv igjen."
    }

    return { error: { code, message } }
  }
}
