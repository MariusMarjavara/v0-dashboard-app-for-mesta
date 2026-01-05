/**
 * Excel Schema Definitions
 *
 * Each schema defines the exact fields expected by each Excel sheet.
 * Voice interpretation MUST conform to these schemas - no free-form data.
 *
 * Principle: Excel schema is the contract. Voice just fills it faster.
 */

import { REGISTRATION_TYPES, type RegistrationType } from "@/lib/types"

export interface SchemaField {
  name: string
  type: "text" | "number" | "boolean" | "select"
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface RegistrationSchema {
  type: RegistrationType
  sheetName: string
  fields: SchemaField[]
  description: string
}

export const VAKTLOGG_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.VOICE_MEMO,
  sheetName: "Vaktlogg",
  description: "Loggføring av vakttlf og hendelser",
  fields: [
    {
      name: "oppringt_av",
      type: "select",
      required: true,
      options: ["Trafikant", "Politiet", "Vegtrafikksentral", "AMK/Brann", "Annet"],
      placeholder: "Hvem ringte?",
    },
    {
      name: "hendelse",
      type: "select",
      required: true,
      options: ["Glatt vei", "Stengt vei", "Ulykke", "Dårlig sikt", "Annet"],
      placeholder: "Hva gjaldt det?",
    },
    {
      name: "sted",
      type: "text",
      required: true,
      placeholder: "Hvor skjedde det?",
    },
    {
      name: "tiltak",
      type: "select",
      required: true,
      options: ["Brøyting", "Strøing", "Befaring", "Ingen tiltak", "Eskalert"],
      placeholder: "Hvilket tiltak?",
    },
    {
      name: "kommentar",
      type: "text",
      required: false,
      placeholder: "Tilleggsinfo",
    },
  ],
}

export const FRIKSJON_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.FRIKSJON,
  sheetName: "Friksjonsmåling",
  description: "Friksjonsmålinger med resultater",
  fields: [
    {
      name: "strekning",
      type: "text",
      required: true,
      placeholder: "Hvor målt?",
    },
    {
      name: "friksjon",
      type: "number",
      required: true,
      placeholder: "Laveste verdi (0.xx)",
    },
    {
      name: "generell_friksjon",
      type: "number",
      required: false,
      placeholder: "Generell verdi",
    },
    {
      name: "tiltak_startet",
      type: "boolean",
      required: false,
      placeholder: "Settes tiltak igang?",
    },
    {
      name: "tiltak",
      type: "text",
      required: false,
      placeholder: "Hvilke tiltak?",
    },
    {
      name: "kommentar",
      type: "text",
      required: false,
      placeholder: "Merknader",
    },
  ],
}

export const VINTERARBEID_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.VINTERARBEID,
  sheetName: "Vinterarbeid",
  description: "Manuelt vinterarbeid (ikke fra kjørelogg)",
  fields: [
    {
      name: "type_arbeid",
      type: "select",
      required: true,
      options: ["Brøytestikksetting", "Skiltkosting", "Rydding av leskur", "Annet"],
      placeholder: "Type arbeid",
    },
    {
      name: "sted",
      type: "text",
      required: true,
      placeholder: "Hvor?",
    },
    {
      name: "antall_stikker",
      type: "number",
      required: false,
      placeholder: "Antall (kun brøytestikk)",
    },
    {
      name: "beskrivelse",
      type: "text",
      required: false,
      placeholder: "Hva er utført?",
    },
  ],
}

export const SCHEMA_REGISTRY: Record<RegistrationType, RegistrationSchema | null> = {
  [REGISTRATION_TYPES.VOICE_MEMO]: VAKTLOGG_SCHEMA,
  [REGISTRATION_TYPES.FRIKSJON]: FRIKSJON_SCHEMA,
  [REGISTRATION_TYPES.VINTERARBEID]: VINTERARBEID_SCHEMA,
  [REGISTRATION_TYPES.MASKIN]: null, // Not yet schema-based
  [REGISTRATION_TYPES.UTBEDRING]: null,
  [REGISTRATION_TYPES.INNKJOP]: null,
  [REGISTRATION_TYPES.ARBEIDSDOK]: null,
  [REGISTRATION_TYPES.AVVIK_RUH]: null,
}

export function getSchemaForType(type: RegistrationType): RegistrationSchema | null {
  return SCHEMA_REGISTRY[type]
}
