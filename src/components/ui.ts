// Shared class strings so every button, input and panel on the site is the same size and
// shape. Radii: controls 8, cards 12. Heights: 36 for controls, 44 for the main actions.

const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

// The one accent on the page: the primary action and nothing else.
export const BTN_PRIMARY = `${BTN} bg-emerald-500 text-ink-950 hover:bg-emerald-400`;
export const BTN_SECONDARY = `${BTN} border border-line-strong bg-ink-700 text-ink-100 hover:border-ink-400`;
export const BTN_GHOST = `${BTN} border border-line text-ink-300 hover:border-line-strong hover:text-ink-100`;
export const BTN_DANGER = `${BTN} border border-red-500/40 text-red-300 hover:bg-red-500/10`;
export const BTN_MD = "h-9 px-4";
export const BTN_LG = "h-11 px-5 text-base";

export const INPUT =
  "h-10 rounded-lg border border-line-strong bg-ink-800 px-3 text-ink-100 placeholder:text-ink-400 focus:border-ink-400";

export const PANEL = "rounded-xl border border-line bg-ink-800";
export const NOTE = `${PANEL} p-4 text-sm text-ink-300`;
export const ERROR = "rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300";

// Segmented control (tabs, sort order).
export const SEGMENT = "inline-flex rounded-lg border border-line bg-ink-800 p-1";
export const SEGMENT_ON = "bg-ink-700 text-ink-100 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]";
export const SEGMENT_OFF = "text-ink-300 hover:text-ink-100";
export const SEGMENT_ITEM = "h-8 rounded-md px-3 text-sm font-medium transition-colors";
