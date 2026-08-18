import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Send, Mail, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface EmailMessage {
  id: string;
  provider_message_id: string | null;
  direction: "inbound" | "outbound";
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  text_body: string | null;
  html_body: string | null;
  status: string;
  source: string | null;
  created_at: string;
}

const stripHtml = (html: string) => html
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const messageText = (message: EmailMessage) =>
  message.text_body?.trim() || (message.html_body ? stripHtml(message.html_body) : "");

const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
}).format(new Date(value));

export const AdminEmailMailbox = () => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    // email_messages is introduced by a new migration; generated Database types can lag one deploy behind.
    const mailboxClient = supabase as any;
    const { data, error } = await mailboxClient
      .from("email_messages")
      .select("id,provider_message_id,direction,from_email,to_emails,cc_emails,subject,text_body,html_body,status,source,created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      console.error("Failed to load admin mailbox", error);
      setMessages([]);
    } else {
      setMessages((data || []) as EmailMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => { void loadMessages(); }, []);

  const inbox = useMemo(() => messages.filter((m) => m.direction === "inbound"), [messages]);
  const sent = useMemo(() => messages.filter((m) => m.direction === "outbound"), [messages]);

  const renderRows = (rows: EmailMessage[], direction: "inbound" | "outbound") => {
    if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Chargement des emails…</div>;
    if (!rows.length) return <div className="py-10 text-center text-sm text-muted-foreground">Aucun email {direction === "inbound" ? "reçu" : "envoyé"} archivé pour le moment.</div>;

    return <div className="divide-y rounded-lg border bg-background">
      {rows.map((message) => {
        const body = messageText(message);
        const isOpen = expanded === message.id;
        return <button type="button" key={message.id} onClick={() => setExpanded(isOpen ? null : message.id)} className="w-full p-4 text-left transition-colors hover:bg-muted/40">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-muted p-2"><Mail className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="truncate text-sm font-semibold">{direction === "inbound" ? message.from_email : (message.to_emails?.join(", ") || "—")}</div>
                <div className="shrink-0 text-xs text-muted-foreground">{formatDate(message.created_at)}</div>
              </div>
              <div className="mt-1 flex items-center gap-2"><div className="truncate text-sm text-foreground">{message.subject || "(sans objet)"}</div><Badge variant="outline" className="shrink-0 text-[10px]">{message.status}</Badge></div>
              {!isOpen && body && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{body}</p>}
              {isOpen && <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm leading-6 text-foreground">
                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                  <div><strong>De :</strong> {message.from_email}</div><div><strong>À :</strong> {message.to_emails?.join(", ") || "—"}</div>
                  {!!message.cc_emails?.length && <div><strong>CC :</strong> {message.cc_emails.join(", ")}</div>}{message.source && <div><strong>Source :</strong> {message.source}</div>}
                </div>
                <div className="whitespace-pre-wrap break-words">{body || "(aucun contenu texte)"}</div>
              </div>}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
        </button>;
      })}
    </div>;
  };

  return <Card className="mb-6">
    <CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="text-lg">Emails Google Review AI</CardTitle><p className="mt-1 text-sm text-muted-foreground">Boîte de réception et historique des emails envoyés.</p></div><Button variant="outline" size="sm" onClick={() => void loadMessages()} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser</Button></CardHeader>
    <CardContent><Tabs defaultValue="inbox"><TabsList className="mb-4"><TabsTrigger value="inbox" className="gap-2"><Inbox className="h-4 w-4" /> Réception <Badge variant="secondary">{inbox.length}</Badge></TabsTrigger><TabsTrigger value="sent" className="gap-2"><Send className="h-4 w-4" /> Envoyés <Badge variant="secondary">{sent.length}</Badge></TabsTrigger></TabsList><TabsContent value="inbox">{renderRows(inbox, "inbound")}</TabsContent><TabsContent value="sent">{renderRows(sent, "outbound")}</TabsContent></Tabs></CardContent>
  </Card>;
};
