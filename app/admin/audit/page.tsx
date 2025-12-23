import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AuditLogPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("rolle").eq("id", user.id).single()

  if (!profile || !["owner", "superuser"].includes(profile.rolle)) {
    redirect("/dashboard")
  }

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      *,
      profiles!audit_logs_changed_by_fkey(full_name, email)
    `)
    .order("changed_at", { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til admin
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <div>
              <CardTitle>Revisjonslogg</CardTitle>
              <CardDescription>
                Alle kritiske endringer i systemet logges automatisk for etterprøvbarhet og sikkerhet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tidspunkt</TableHead>
                  <TableHead>Tabell</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Utført av</TableHead>
                  <TableHead>Detaljer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(log.changed_at).toLocaleString("nb-NO", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.table_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "INSERT" ? "default" : log.action === "UPDATE" ? "secondary" : "destructive"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.profiles?.full_name || "System"}</div>
                        <div className="text-xs text-muted-foreground">{log.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:underline">Vis endringer</summary>
                        <div className="mt-2 space-y-2 rounded bg-muted p-2">
                          {log.old_data && (
                            <div>
                              <span className="font-semibold text-red-600">Før:</span>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.old_data, null, 2)}</pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <span className="font-semibold text-green-600">Etter:</span>
                              <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.new_data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </TableCell>
                  </TableRow>
                ))}
                {!logs || logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Ingen loggoppføringer funnet
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
