"use client";
import { useSyncExternalStore } from "react";

// Whether tiles show only the character's picture (smaller, screenshot-friendly lists) or the
// picture with the name. A per-viewer convenience, so it lives in this browser only.
const KEY = "lobbytier.picturesOnly";
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setPicturesOnly(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Private windows can block storage; the switch then lasts until the page reloads.
  }
  memory = on;
  listeners.forEach((l) => l());
}

let memory: boolean | null = null;

export function usePicturesOnly() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => memory ?? (memory = read()),
    () => false,
  );
}
