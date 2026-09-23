import { createFileRoute } from "@tanstack/react-router";
import { Fase2Protocolo } from "@/components/Fase2Protocolo";

export const Route = createFileRoute("/_authenticated/protocolo/fase-2")({
  component: Fase2Protocolo,
});
