import type { SVGProps } from "react";

/** Silhueta de cintura/abdômen — usa currentColor para seguir a paleta do app. */
export function WaistIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* lateral esquerda: cintura marcada */}
      <path d="M18 4c-2 8-4 12-4 17s3 7 3 11-3 6-3 12 1 12 2 16" />
      {/* lateral direita */}
      <path d="M46 4c2 8 4 12 4 17s-3 7-3 11 3 6 3 12-1 12-2 16" />
      {/* linha do abdômen */}
      <path d="M15 33c4 0 6 3 9 3s4-2 8-2 5 2 8 2 5-3 9-3" />
      {/* linha do quadril / virilha */}
      <path d="M17 40c5 1 9 4 15 15 6-11 10-14 15-15" />
      {/* centro */}
      <path d="M32 55v6" />
      <circle cx="32" cy="27" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
