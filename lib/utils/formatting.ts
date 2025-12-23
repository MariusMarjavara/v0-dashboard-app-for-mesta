export function formatDateTime(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date
    .getFullYear()
    .toString()
    .slice(-2)} - ${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}
