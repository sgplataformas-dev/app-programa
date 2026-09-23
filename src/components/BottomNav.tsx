import { Link } from "@tanstack/react-router";
import { Home, PlayCircle, ListChecks, User } from "lucide-react";
import { WaistIcon } from "@/components/icons/WaistIcon";

const items = [
  { to: "/hoje", label: "Home", icon: Home },
  { to: "/aulas", label: "Aulas Bônus", icon: PlayCircle },
  { to: "/flacidez", label: "Flacidez", icon: WaistIcon },
  { to: "/protocolo", label: "Protocolo", icon: ListChecks },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium"
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
