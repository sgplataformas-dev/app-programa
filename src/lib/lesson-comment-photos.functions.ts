import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  paths: z.array(z.string().min(1)).max(100),
});

export const getLessonCommentSignedUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.paths.length === 0) return { urls: {} as Record<string, string> };

    // Only sign paths that are actually referenced by a real lesson_comments row.
    // This prevents an authenticated user from requesting signed URLs for arbitrary
    // files in other users' storage folders by guessing or crafting paths.
    const { data: rows, error: lookupError } = await context.supabase
      .from("lesson_comments")
      .select("photo_url")
      .in("photo_url", data.paths);
    if (lookupError) throw lookupError;
    const allowed = new Set(
      (rows ?? []).map((r) => r.photo_url).filter((p): p is string => !!p),
    );
    const safePaths = data.paths.filter((p) => allowed.has(p));
    if (safePaths.length === 0) return { urls: {} as Record<string, string> };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("lesson-comments")
      .createSignedUrls(safePaths, 5 * 60); // 5 min TTL — paths are broadcast via Realtime to all authenticated subscribers, so keep the signed-URL window short.
    if (error) throw error;
    const urls: Record<string, string> = {};
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) urls[s.path] = s.signedUrl;
    }
    return { urls };
  });

