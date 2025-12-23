import type { AppLink } from "./types"

export const apps: AppLink[] = [
  {
    id: "dokumenter",
    name: "Dokumenter",
    description: "Prosedyrer, skjemaer og instrukser",
    icon: "FileText",
    webUrl: "/documents",
    contractTypes: ["riksveg", "fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
  {
    id: "elrapp",
    name: "Elrapp Entreprenør",
    description: "Oversiktsliste",
    icon: "ClipboardList",
    playStoreUrl: "https://play.google.com/store/search?q=elrapp&c=apps",
    appStoreUrl: "https://apps.apple.com/search?term=elrapp",
    androidPackage: "no.elrapp.app",
    contractTypes: ["riksveg", "fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
  {
    id: "landax",
    name: "Landax",
    description: "SJA, sjekklister og uønskede hendelser",
    icon: "ShieldCheck",
    playStoreUrl: "https://play.google.com/store/search?q=Landax&c=apps",
    appStoreUrl: "https://apps.apple.com/search?term=landax",
    androidPackage: "com.landax.app",
    contractTypes: ["riksveg", "fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
  {
    id: "arbeidsvarsling",
    name: "Arbeidsvarsling Triona",
    description: "Arbeidsvarslingsplaner og loggbøker",
    icon: "AlertTriangle",
    playStoreUrl: "https://play.google.com/store/search?q=triona+arbeidsvarsling&c=apps",
    appStoreUrl: "https://apps.apple.com/search?term=triona+arbeidsvarsling",
    androidPackage: "no.triona.arbeidsvarsling",
    contractTypes: ["riksveg", "fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
  {
    id: "linx",
    name: "Linx",
    description: "Maskinoppfølgning",
    icon: "Truck",
    playStoreUrl: "https://play.google.com/store/apps/details?id=no.verdande.mobile",
    appStoreUrl: "https://apps.apple.com/app/linx",
    androidPackage: "no.verdande.mobile",
    contractTypes: ["riksveg", "fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
  {
    id: "handyman",
    name: "Handyman",
    description: "Timeføring",
    icon: "Clock",
    playStoreUrl: "https://play.google.com/store/search?q=Handyman&c=apps",
    appStoreUrl: "https://apps.apple.com/search?term=handyman",
    androidPackage: "no.handyman.app",
    contractTypes: ["riksveg"],
    userTypes: ["mesta"],
  },
  {
    id: "isyroad",
    name: "Isyroad",
    description: "Veg- og føreforhold",
    icon: "Navigation",
    webUrl: "https://isyroad.nois.no/",
    playStoreUrl: "https://isyroad.nois.no/",
    contractTypes: ["fylkeskommune"],
    userTypes: ["mesta", "ue"],
  },
]

export function getAppsForUser(
  userType: "mesta" | "ue",
  contractType?: "riksveg" | "fylkeskommune" | "felleskontrakt",
): AppLink[] {
  return apps.filter((app) => {
    // Sjekk brukertype
    if (app.userTypes && !app.userTypes.includes(userType)) {
      return false
    }

    // Sjekk kontraktstype
    if (contractType && app.contractTypes) {
      // Felleskontrakt vises som riksveg for app-filtrering
      const effectiveType = contractType === "felleskontrakt" ? "riksveg" : contractType
      if (!app.contractTypes.includes(effectiveType)) {
        return false
      }
    }

    return true
  })
}
