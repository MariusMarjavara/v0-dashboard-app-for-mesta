import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import JSZip from "jszip"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const exportType = searchParams.get("type") || "user"
  const contractNummer = searchParams.get("contract")
  const saveToSupabase = searchParams.get("save") === "true"

  // Hent brukerinfo
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  let query = supabase.from("registrations").select("*").order("created_at", { ascending: false })

  // Filtrer basert på eksporttype (samme logikk som registreringer)
  if (exportType === "user") {
    query = query.eq("user_id", user.id)
  } else if (exportType === "admin" && contractNummer) {
    const { data: isAdmin } = await supabase
      .from("contract_admins")
      .select("*")
      .eq("user_id", user.id)
      .eq("contract_nummer", Number.parseInt(contractNummer))
      .single()

    if (!isAdmin && profile?.user_type !== "mesta") {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const { data: contractUsers } = await supabase.from("profiles").select("id").eq("contract_area", contractNummer)

    if (contractUsers && contractUsers.length > 0) {
      const userIds = contractUsers.map((u) => u.id)
      query = query.in("user_id", userIds)
    }
  } else if (exportType === "all") {
    if (profile?.user_type !== "mesta") {
      return new NextResponse("Unauthorized", { status: 403 })
    }
  }

  const { data: registrations, error } = await query

  if (error) {
    return new NextResponse("Error fetching registrations", { status: 500 })
  }

  // Samle alle bildefiler
  const zip = new JSZip()
  let imageCount = 0

  for (const reg of registrations || []) {
    if (reg.data?.images && Array.isArray(reg.data.images) && reg.data.images.length > 0) {
      const folderName = `${reg.registration_type}/${reg.registered_by_name}/${new Date(reg.created_at).toLocaleDateString("nb-NO").replace(/\./g, "-")}`

      for (let i = 0; i < reg.data.images.length; i++) {
        const img = reg.data.images[i]
        try {
          let storagePath: string | null = null

          if (img.url && typeof img.url === "string") {
            // URL-format: https://[project].supabase.co/storage/v1/object/sign/registrations/[path]?token=...
            // Vi trenger bare [path] delen
            const signPattern = "/storage/v1/object/sign/registrations/"
            const signIndex = img.url.indexOf(signPattern)

            if (signIndex !== -1) {
              const afterSign = img.url.substring(signIndex + signPattern.length)
              // Fjern query parameters (alt etter ?)
              storagePath = afterSign.split("?")[0]
            }
          }

          // Hvis vi fant storage path, last ned bildet
          if (storagePath) {
            const { data: imageData, error: imgError } = await supabase.storage
              .from("registrations")
              .download(storagePath)

            if (!imgError && imageData) {
              const buffer = await imageData.arrayBuffer()
              const fileName = storagePath.split("/").pop() || `image_${imageCount + 1}.jpg`
              zip.folder(folderName)?.file(fileName, buffer)
              imageCount++
            } else {
              console.error("Error downloading image:", imgError?.message || "No image data")
            }
          } else {
            console.error("Could not extract storage path from URL:", img.url)
          }
        } catch (err) {
          console.error("Error downloading image:", err)
        }
      }
    } else if (reg.data?.full_images && Array.isArray(reg.data.full_images) && reg.data.full_images.length > 0) {
      const folderName = `${reg.registration_type}/${reg.registered_by_name}/${new Date(reg.created_at).toLocaleDateString("nb-NO").replace(/\./g, "-")}`

      for (const img of reg.data.full_images) {
        try {
          if (img.storage_path) {
            const { data: imageData, error: imgError } = await supabase.storage
              .from("registrations")
              .download(img.storage_path)

            if (!imgError && imageData) {
              const buffer = await imageData.arrayBuffer()
              const fileName = img.storage_path.split("/").pop() || `image_${imageCount + 1}.jpg`
              zip.folder(folderName)?.file(fileName, buffer)
              imageCount++
            }
          }
        } catch (err) {
          console.error("Error downloading image:", err)
        }
      }
    }
  }

  if (imageCount === 0) {
    return new NextResponse("Ingen bilder å eksportere", { status: 404 })
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
  const filename = `bilder_${exportType}_${new Date().toISOString().split("T")[0]}.zip`

  // Lagre til Supabase hvis forespurt
  if (saveToSupabase) {
    const filePath = `exports/images/${exportType}/${contractNummer || "all"}/${filename}`

    await supabase.storage.from("registrations").upload(filePath, zipBuffer, {
      contentType: "application/zip",
      upsert: false,
    })

    await supabase.from("export_logs").insert({
      user_id: user.id,
      export_type: `${exportType}_images`,
      contract_nummer: contractNummer ? Number.parseInt(contractNummer) : null,
      file_path: filePath,
      record_count: imageCount,
    })
  }

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
