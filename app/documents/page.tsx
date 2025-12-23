"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Upload, ArrowLeft, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Document {
  id: string
  title: string
  description: string | null
  file_name: string
  file_path: string
  file_type: string
  file_size: number | null
  category: string | null
  contract_nummer: number | null
  uploaded_by: string
  uploaded_at: string
}

interface Profile {
  rolle: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("user")
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "prosedyre",
    file: null as File | null,
  })
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadDocuments()
    checkUserRole()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchQuery, categoryFilter])

  async function checkUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from("profiles").select("rolle").eq("id", user.id).single()

    if (profile) {
      setUserRole(profile.rolle)
    }
  }

  async function loadDocuments() {
    try {
      const { data, error } = await supabase.from("documents").select("*").order("uploaded_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("[v0] Error loading documents:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke laste dokumenter",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterDocuments() {
    let filtered = documents

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((doc) => doc.category === categoryFilter)
    }

    setFilteredDocuments(filtered)
  }

  async function handleDownload(doc: Document) {
    try {
      const { data, error } = await supabase.storage.from("registrations").createSignedUrl(doc.file_path, 60)

      if (error) throw error

      window.open(data.signedUrl, "_blank")

      toast({
        title: "Suksess",
        description: "Dokumentet lastes ned",
      })
    } catch (error) {
      console.error("[v0] Error downloading document:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke laste ned dokumentet",
        variant: "destructive",
      })
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!uploadForm.file || !uploadForm.title) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut alle påkrevde felter",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("title", uploadForm.title)
      formData.append("description", uploadForm.description)
      formData.append("category", uploadForm.category)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload feilet")
      }

      toast({
        title: "Suksess",
        description: "Dokumentet ble lastet opp",
      })

      setShowUploadDialog(false)
      setUploadForm({ title: "", description: "", category: "prosedyre", file: null })
      loadDocuments()
    } catch (error) {
      console.error("[v0] Error uploading document:", error)
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke laste opp dokumentet",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Er du sikker på at du vil slette dette dokumentet?")) return

    try {
      const response = await fetch(`/api/documents/delete?id=${docId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Sletting feilet")
      }

      toast({
        title: "Suksess",
        description: "Dokumentet ble slettet",
      })

      loadDocuments()
    } catch (error) {
      console.error("[v0] Error deleting document:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke slette dokumentet",
        variant: "destructive",
      })
    }
  }

  const canManage = ["owner", "superuser", "admin"].includes(userRole)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="text-lg">Laster dokumenter...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Dokumenter</h1>
          </div>

          {canManage && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Last opp
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Last opp dokument</DialogTitle>
                  <DialogDescription>Fyll ut informasjon om dokumentet du vil laste opp</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tittel *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Dokumenttittel"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Kort beskrivelse av dokumentet"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prosedyre">Prosedyre</SelectItem>
                        <SelectItem value="skjema">Skjema</SelectItem>
                        <SelectItem value="instruks">Instruks</SelectItem>
                        <SelectItem value="annet">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="file">Fil *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Avbryt
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? "Laster opp..." : "Last opp"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter dokumenter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                <SelectItem value="prosedyre">Prosedyrer</SelectItem>
                <SelectItem value="skjema">Skjemaer</SelectItem>
                <SelectItem value="instruks">Instrukser</SelectItem>
                <SelectItem value="annet">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumenter funnet</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          {doc.category && <span className="bg-gray-100 px-2 py-0.5 rounded">{doc.category}</span>}
                          {doc.file_size && <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>}
                          <span className="truncate">{doc.file_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
