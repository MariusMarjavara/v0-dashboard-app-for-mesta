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
  sheetName: "Vakttlf / loggbok",
  description: "Loggføring av vakttlf og hendelser",
  fields: [
    {
      name: "vakttlf",
      type: "boolean",
      required: false,
      placeholder: "Er dette en vakttlf?",
    },
    {
      name: "oppringt_av",
      type: "select",
      required: false,
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
      placeholder: "Sted eller strekning",
    },
    {
      name: "tiltak",
      type: "select",
      required: false, // Changed to optional, but strongly encouraged for operational decisions
      options: ["Brøyting", "Strøing", "Befaring", "Ingen tiltak", "Eskalert"],
      placeholder: "Hvilket tiltak?",
    },
    {
      name: "operativ_status",
      type: "select",
      required: false,
      options: ["Utført strøing", "Utført brøyting", "Under utføring", "Ingen tiltak"],
      placeholder: "Status på tiltak (hvis relevant)",
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

export const MANUELT_ARBEID_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.ARBEIDSDOK,
  sheetName: "Manuelt arbeid",
  description: "Manuelt utført arbeid (brøyting, strøing, skilt)",
  fields: [
    {
      name: "type_arbeid",
      type: "select",
      required: true,
      options: ["Brøytestikksetting", "Skiltkosting", "Rydding av leskur", "Brøyting", "Strøing", "Annet"],
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

export const MASKIN_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.MASKIN,
  sheetName: "Maskinoppfølging",
  description: "Maskin- og utstyrsoppfølging",
  fields: [
    {
      name: "maskin_type",
      type: "select",
      required: true,
      options: ["Traktor", "Fres", "Bil", "Annet"],
      placeholder: "Type maskin",
    },
    {
      name: "arbeid",
      type: "text",
      required: true,
      placeholder: "Hva ble gjort?",
    },
    {
      name: "beskrivelse",
      type: "text",
      required: false,
      placeholder: "Detaljer",
    },
  ],
}

export const INNKJOP_SCHEMA: RegistrationSchema = {
  type: REGISTRATION_TYPES.INNKJOP,
  sheetName: "Innkjøp",
  description: "Innkjøp og materiell",
  fields: [
    {
      name: "hva",
      type: "text",
      required: true,
      placeholder: "Hva ble kjøpt?",
    },
    {
      name: "antall",
      type: "number",
      required: false,
      placeholder: "Antall (stk)",
    },
    {
      name: "hvor",
      type: "text",
      required: false,
      placeholder: "Hvor kjøpt?",
    },
    {
      name: "beskrivelse",
      type: "text",
      required: false,
      placeholder: "Detaljer",
    },
  ],
}

export const SCHEMA_REGISTRY: Record<RegistrationType, RegistrationSchema | null> = {
  [REGISTRATION_TYPES.VOICE_MEMO]: VAKTLOGG_SCHEMA,
  [REGISTRATION_TYPES.FRIKSJON]: FRIKSJON_SCHEMA,
  [REGISTRATION_TYPES.VINTERARBEID]: null,
  [REGISTRATION_TYPES.MASKIN]: MASKIN_SCHEMA,
  [REGISTRATION_TYPES.INNKJOP]: INNKJOP_SCHEMA,
  [REGISTRATION_TYPES.UTBEDRING]: null,
  [REGISTRATION_TYPES.ARBEIDSDOK]: MANUELT_ARBEID_SCHEMA,
  [REGISTRATION_TYPES.AVVIK_RUH]: null,
}

export function getSchemaForType(type: RegistrationType): RegistrationSchema | null {
  return SCHEMA_REGISTRY[type]
}
