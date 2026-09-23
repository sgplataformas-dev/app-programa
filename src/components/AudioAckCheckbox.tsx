import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DECLARACAO_AUDIO =
  "Declaro que ouvi o áudio, compreendi as orientações do Fernando e estou ciente de que, caso eu opte por não seguir o protocolo de desintoxicação recomendado, essa decisão será de minha inteira e exclusiva responsabilidade.";

export function AudioAckCheckbox({ moduleId }: { moduleId: string }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("audio_acks")
        .select("id")
        .eq("module_id", moduleId)
        .maybeSingle();
      if (!active) return;
      setChecked(!!data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [moduleId]);

  async function onToggle(next: boolean) {
    if (saving || loading) return;
    setSaving(true);
    setChecked(next);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setChecked(!next);
      setSaving(false);
      return;
    }
    if (next) {
      const { error } = await supabase
        .from("audio_acks")
        .insert({ user_id: userId, module_id: moduleId, declaration: DECLARACAO_AUDIO });
      if (error) setChecked(false);
    } else {
      const { error } = await supabase
        .from("audio_acks")
        .delete()
        .eq("module_id", moduleId)
        .eq("user_id", userId);
      if (error) setChecked(true);
    }
    setSaving(false);
  }

  return (
    <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl bg-background/60 p-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={loading || saving}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
      />
      <span className="text-xs leading-relaxed text-foreground/80">{DECLARACAO_AUDIO}</span>
    </label>
  );
}
