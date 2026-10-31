// Lets the tests import the site's TypeScript directly: resolves the "@/..." alias from
// tsconfig and adds .ts/.tsx extensions. Node strips the types itself (Node 22.18+).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, next) {
  let url;
  if (specifier.startsWith("@/")) url = new URL(specifier.slice(2), src).href;
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith(src.href)) url = new URL(specifier, context.parentURL).href;
  if (url) {
    for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
      const candidate = url + ext;
      if (existsSync(fileURLToPath(candidate)) && !candidate.endsWith("/")) return next(candidate, context);
    }
  }
  return next(specifier, context);
}
