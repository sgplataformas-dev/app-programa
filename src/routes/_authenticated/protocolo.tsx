import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/protocolo")({
  component: ProtocoloLayout,
});

function ProtocoloLayout() {
  return <Outlet />;
}
