import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 })
    }

    // Sjekk om bruker er administrator
    const { data: profile } = await supabase.from("profiles").select("rolle").eq("id", user.id).single()

    if (!profile || !["owner", "superuser", "admin"].includes(profile.rolle)) {
      return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Dokument-ID mangler" }, { status: 400 })
    }

    // Hent dokumentinfo
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: "Dokument ikke funnet" }, { status: 404 })
    }

    // Slett fil fra storage
    const { error: storageError } = await supabase.storage.from("registrations").remove([document.file_path])

    // Storage delete failed, but continue with database deletion
    if (storageError) {
    }

    // Slett fra database
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId)

    if (deleteError) {
      return NextResponse.json({ error: "Feil ved sletting av dokument" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Intern serverfeil" }, { status: 500 })
  }
}
