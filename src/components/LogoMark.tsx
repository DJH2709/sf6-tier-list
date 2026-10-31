// The LobbyTier mark: a 1-2-3 stair of tier blocks (S, A, B), few players at the top and
// more at each step down. Source files and exports live outside the repo (Project 6/logo).
const BLOCKS: [number, number, string][] = [
  [0, 0, "#f43f5e"],
  [0, 1, "#fb923c"], [1, 1, "#fb923c"],
  [0, 2, "#fcd34d"], [1, 2, "#fcd34d"], [2, 2, "#fcd34d"],
];

export default function LogoMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 37 37" width={size} height={size} className={className} aria-hidden focusable="false">
      {BLOCKS.map(([col, row, fill]) => (
        <rect key={`${col}${row}`} x={col * 13} y={row * 13} width="11" height="11" rx="2.5" fill={fill} />
      ))}
    </svg>
  );
}
