import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Send, Trash2, MessageCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLessonCommentSignedUrls } from "@/lib/lesson-comment-photos.functions";


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

type Props = { lessonId: string };

export function LessonComments({ lessonId }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Load current user + name + admin role
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", auth.user.id)
        .maybeSingle();
      setUserName(profile?.nome || auth.user.email?.split("@")[0] || "Aluno(a)");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    })();
  }, []);

  // Load comments + realtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lesson_comments")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });
      if (mounted) {
        setComments((data as Comment[]) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`lesson-comments-${lessonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_comments", filter: `lesson_id=eq.${lessonId}` },
        (payload) => {
          setComments((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Comment;
              if (prev.some((c) => c.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== (payload.old as Comment).id);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Comment;
              return prev.map((c) => (c.id === row.id ? row : c));
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [lessonId]);

  // Resolve signed URLs for photos
  useEffect(() => {
    const paths = comments
      .map((c) => c.photo_url)
      .filter((p): p is string => !!p && !signedUrls[p]);
    if (paths.length === 0) return;
    (async () => {
      try {
        const { urls } = await getLessonCommentSignedUrls({ data: { paths } });
        setSignedUrls((prev) => ({ ...prev, ...urls }));
      } catch {
        // ignore — photos just won't render this cycle
      }
    })();
  }, [comments, signedUrls]);


  const tree = useMemo(() => {
    const roots: Comment[] = [];
    const byParent: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        (byParent[c.parent_id] ||= []).push(c);
      } else {
        roots.push(c);
      }
    }
    roots.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { roots, byParent };
  }, [comments]);

  return (
    <div className="space-y-4">
      <CommentForm
        lessonId={lessonId}
        userId={userId}
        userName={userName}
        parentId={null}
        placeholder="Escreva um comentário..."
      />

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando comentários...</p>
      ) : tree.roots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <MessageCircle className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tree.roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={tree.byParent[c.id] || []}
              currentUserId={userId}
              currentUserName={userName}
              isAdmin={isAdmin}
              lessonId={lessonId}
              signedUrls={signedUrls}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  currentUserId,
  currentUserName,
  isAdmin,
  lessonId,
  signedUrls,
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId: string | null;
  currentUserName: string;
  isAdmin: boolean;
  lessonId: string;
  signedUrls: Record<string, string>;
}) {
  const [replying, setReplying] = useState(false);
  const canManage = currentUserId === comment.user_id || isAdmin;

  const handleDelete = () => {
    toast("Apagar este comentário?", {
      action: {
        label: "Apagar",
        onClick: async () => {
          const { error } = await supabase.from("lesson_comments").delete().eq("id", comment.id);
          if (error) toast.error("Não foi possível apagar.");
          else toast.success("Comentário apagado.");
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <CommentBody comment={comment} signedUrls={signedUrls} canManage={canManage} onDelete={handleDelete} />

      <div className="mt-2 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="font-medium text-primary"
        >
          {replying ? "Cancelar" : "Responder"}
        </button>
      </div>

      {replying && (
        <div className="mt-3">
          <CommentForm
            lessonId={lessonId}
            userId={currentUserId}
            userName={currentUserName}
            parentId={comment.id}
            placeholder={`Responder a ${comment.author_name}...`}
            onDone={() => setReplying(false)}
            compact
          />
        </div>
      )}

      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l-2 border-border pl-3">
          {replies
            .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
            .map((r) => {
              const replyManage = currentUserId === r.user_id || isAdmin;
              return (
                <li key={r.id}>
                  <CommentBody
                    comment={r}
                    signedUrls={signedUrls}
                    canManage={replyManage}
                    onDelete={() => {
                      toast("Apagar esta resposta?", {
                        action: {
                          label: "Apagar",
                          onClick: async () => {
                            const { error } = await supabase
                              .from("lesson_comments")
                              .delete()
                              .eq("id", r.id);
                            if (error) toast.error("Não foi possível apagar.");
                            else toast.success("Resposta apagada.");
                          },
                        },
                        cancel: { label: "Cancelar", onClick: () => {} },
                      });
                    }}
                  />
                </li>
              );
            })}
        </ul>
      )}
    </li>
  );
}

function CommentBody({
  comment,
  signedUrls,
  canManage,
  onDelete,
}: {
  comment: Comment;
  signedUrls: Record<string, string>;
  canManage: boolean;
  onDelete: () => void;
}) {
  const initial = (comment.author_name || "?").trim().charAt(0).toUpperCase();
  const photo = comment.photo_url ? signedUrls[comment.photo_url] : null;
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold leading-tight">
            {comment.author_name || "Aluno(a)"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {formatRelative(comment.created_at)}
          </p>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {comment.content}
        </p>
        {comment.photo_url && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            {photo ? (
              <img src={photo} alt="Anexo" className="max-h-80 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        {canManage && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" /> Apagar
          </button>
        )}
      </div>
    </div>
  );
}

function CommentForm({
  lessonId,
  userId,
  userName,
  parentId,
  placeholder,
  onDone,
  compact,
}: {
  lessonId: string;
  userId: string | null;
  userName: string;
  parentId: string | null;
  placeholder: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || (!text.trim() && !file) || submitting) return;
    setSubmitting(true);
    try {
      let photoPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${lessonId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("lesson-comments")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        photoPath = path;
      }
      const { error } = await supabase.from("lesson_comments").insert({
        lesson_id: lessonId,
        user_id: userId,
        parent_id: parentId,
        author_name: userName,
        content: text.trim() || "📷",
        photo_url: photoPath,
      });
      if (error) throw error;
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível publicar o comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-border bg-card ${compact ? "p-3" : "p-4"}`}
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={2000}
        className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      />
      {preview && (
        <div className="relative mt-2 inline-block">
          <img src={preview} alt="Pré-visualização" className="max-h-40 rounded-lg" />
          <button
            type="button"
            onClick={() => setFile(null)}
            className="absolute -right-2 -top-2 rounded-full bg-foreground/80 p-1 text-background"
            aria-label="Remover foto"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent">
          <ImageIcon className="h-4 w-4" />
          Foto
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 5 * 1024 * 1024) {
                toast.error("A imagem deve ter no máximo 5MB.");
                return;
              }
              setFile(f);
            }}
          />
        </label>
        <Button type="submit" size="sm" disabled={submitting || (!text.trim() && !file)}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </form>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
