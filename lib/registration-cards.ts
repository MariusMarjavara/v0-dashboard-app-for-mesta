export interface RegistrationCardConfig {
  id: string
  title: string
  description: string
  icon: "arbeidsdok" | "friksjon" | "vinter" | "innkjop" | "maskin" | "utbedring"
  userTypes: ("mesta" | "ue")[]
}

export const REGISTRATION_CARDS: RegistrationCardConfig[] = [
  {
    id: "arbeidsdok",
    title: "Arbeidsdokumentering",
    description: "Bilder og ressursbruk for oppdrag på kontrakten",
    icon: "arbeidsdok",
    userTypes: ["mesta", "ue"],
  },
  {
    id: "friksjon",
    title: "Friksjonsmålinger",
    description: "Registrer friksjonsmålinger og tiltak",
    icon: "friksjon",
    userTypes: ["mesta", "ue"],
  },
  {
    id: "vinter",
    title: "Manuelt vinterarbeid",
    description: "Brøytestikk, skiltkosting, leskur m.m.",
    icon: "vinter",
    userTypes: ["mesta", "ue"],
  },
  {
    id: "innkjop",
    title: "Innkjøp",
    description: "Registrer innkjøp og utgifter",
    icon: "innkjop",
    userTypes: ["mesta"],
  },
  {
    id: "maskin",
    title: "Maskinoppfølgning",
    description: "Innleid maskin - vedlikehold og forbruksvarer",
    icon: "maskin",
    userTypes: ["mesta"],
  },
]

export function getRegistrationCardsForUser(userType: "mesta" | "ue"): RegistrationCardConfig[] {
  return REGISTRATION_CARDS.filter((card) => card.userTypes.includes(userType))
}
