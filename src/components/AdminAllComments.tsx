import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ImageIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { findAula } from "@/content/aulas";

type Comment = {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  photo_url: string | null;
  created_at: string;
};

function lessonTitle(lessonId: string) {
  const found = findAula(lessonId);
  if (!found) return lessonId;
  return `${found.modulo.titulo} — ${found.aula.titulo}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAllComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [adminName, setAdminName] = useState("Equipe Active");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lesson_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Não foi possível carregar os comentários.");
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (profile?.nome) setAdminName(profile.nome);
    })();

    const channel = supabase
      .channel("admin-all-comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_comments" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const repliesByParent = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (c.parent_id) (map[c.parent_id] ||= []).push(c);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return map;
  }, [comments]);

  const roots = useMemo(() => {
    const term = search.trim().toLowerCase();
    return comments
      .filter((c) => !c.parent_id)
      .filter((c) => (onlyUnanswered ? !repliesByParent[c.id]?.length : true))
      .filter((c) =>
        term
          ? c.content.toLowerCase().includes(term) ||
            c.author_name.toLowerCase().includes(term) ||
            lessonTitle(c.lesson_id).toLowerCase().includes(term)
          : true,
      );
  }, [comments, search, onlyUnanswered, repliesByParent]);

  const unansweredCount = useMemo(
    () => comments.filter((c) => !c.parent_id && !repliesByParent[c.id]?.length).length,
    [comments, repliesByParent],
  );

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">
              Perguntas e comentários
            </h2>
            <p className="text-xs text-muted-foreground">
              Todos os comentários das aulas em um só lugar · {unansweredCount} sem resposta
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 pl-9"
              placeholder="Buscar aluno, aula ou texto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={onlyUnanswered ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyUnanswered((v) => !v)}
          >
            Sem resposta
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {loading && comments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando comentários...
          </CardContent>
        </Card>
      ) : roots.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum comentário encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roots.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              replies={repliesByParent[c.id] ?? []}
              adminName={adminName}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentCard({
  comment,
  replies,
  adminName,
  onChanged,
}: {
  comment: Comment;
  replies: Comment[];
  adminName: string;
  onChanged: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSending(false);
      return;
    }
    const { error } = await supabase.from("lesson_comments").insert({
      lesson_id: comment.lesson_id,
      user_id: auth.user.id,
      parent_id: comment.id,
      author_name: adminName,
      content: value,
    });
    setSending(false);
    if (error) {
      toast.error("Não foi possível responder.");
      return;
    }
    setText("");
    setReplying(false);
    toast.success("Resposta enviada.");
    onChanged();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este comentário?")) return;
    const { error } = await supabase.from("lesson_comments").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir.");
    else {
      toast.success("Comentário excluído.");
      onChanged();
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
            {comment.photo_url && (
              <Badge variant="secondary" className="gap-1">
                <ImageIcon className="h-3 w-3" /> foto
              </Badge>
            )}
            {replies.length === 0 ? (
              <Badge variant="destructive">sem resposta</Badge>
            ) : (
              <Badge variant="outline">{replies.length} resposta(s)</Badge>
            )}
          </div>
          <Link
            to="/aulas/$lessonId"
            params={{ lessonId: comment.lesson_id }}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {lessonTitle(comment.lesson_id)}
          </Link>
        </div>

        <p className="whitespace-pre-wrap text-sm">{comment.content}</p>

        {replies.length > 0 && (
          <div className="space-y-2 border-l-2 border-border pl-3">
            {replies.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{r.author_name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{r.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {replying ? (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva a resposta..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply} disabled={sending || !text.trim()}>
                {sending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1 h-4 w-4" />
                )}
                Responder
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReplying(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplying(true)}>
              <Send className="mr-1 h-4 w-4" /> Responder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
