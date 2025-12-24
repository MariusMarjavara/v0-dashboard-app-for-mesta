import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Sjekk autentisering
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 })
    }

    // Sjekk om bruker er administrator
    const { data: profile } = await supabase.from("profiles").select("rolle").eq("id", user.id).single()

    if (!profile || !["owner", "superuser", "admin"].includes(profile.rolle)) {
      return NextResponse.json(
        { error: "Ingen tilgang - kun administratorer kan laste opp dokumenter" },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const contractNummer = formData.get("contractNummer") as string

    if (!file || !title) {
      return NextResponse.json({ error: "Fil og tittel er påkrevd" }, { status: 400 })
    }

    // Last opp fil til Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage.from("registrations").upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      return NextResponse.json({ error: "Feil ved opplasting av fil" }, { status: 500 })
    }

    // Lagre metadata i database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        title,
        description,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category,
        contract_nummer: contractNummer ? Number.parseInt(contractNummer) : null,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Slett filen hvis database-insert feiler
      await supabase.storage.from("registrations").remove([filePath])
      return NextResponse.json({ error: "Feil ved lagring av dokumentmetadata" }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    return NextResponse.json({ error: "Intern serverfeil" }, { status: 500 })
  }
}
