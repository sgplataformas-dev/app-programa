import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/active.functions";
import { VturbPlayer } from "@/components/VturbPlayer";

export const Route = createFileRoute("/_authenticated/boas-vindas")({
  component: BoasVindas,
});

const VTURB_PLAYER_ID = "vid-6a29ada451d4532b13a677c9";
const VTURB_SCRIPT_SRC =
  "https://scripts.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/players/6a29ada451d4532b13a677c9/v4/player.js";

function BoasVindas() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  useEffect(() => {
    if (document.querySelector(`script[src="${VTURB_SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = VTURB_SCRIPT_SRC;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const nome = (data?.nome || "").split(" ")[0];

  return (
    <div className="px-5 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold leading-tight sm:text-2xl">
        {nome ? `${nome}, seja muito bem-vinda ao Programa Active!` : "Seja muito bem-vinda ao Programa Active!"} 👋
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Assista o vídeo abaixo para responder sua avaliação!
      </p>

      <div className="mt-6 w-full overflow-hidden rounded-2xl">
        <div className="aspect-video w-full">
          <VturbPlayer vturbId={VTURB_PLAYER_ID} />
        </div>
      </div>

      <p className="mt-6 text-base text-muted-foreground">
        Estamos muito felizes em ter você por aqui. Vamos começar com uma avaliação rápida para entendermos como te ajudar melhor.
      </p>

      <Link to="/intake" className="mt-6 block">
        <Button className="h-14 w-full text-base">Iniciar Avaliação</Button>
      </Link>
    </div>
  );
}

