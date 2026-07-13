// Cinder 標記（原創，不使用第三方商標）。
export function CinderMark({ size = 40 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="24" fill="#0f1f3a" />
      <circle cx="50" cy="50" r="30" fill="#ff7a2f" />
      <circle cx="50" cy="48" r="19" fill="#ffc24d" />
      <circle cx="44" cy="42" r="9" fill="#ffe6a3" />
    </svg>
  );
}
