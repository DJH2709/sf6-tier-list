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
      if (!existsSync(fileURLToPath(candidate)) || candidate.endsWith("/")) continue;
      return next(candidate, context);
    }
  }
  return next(specifier, context);
}

// The site's .ts files are ES modules (saying so saves Node guessing, and warning), and it
// imports JSON the bundler way, without `with { type: "json" }`.
export async function load(url, context, next) {
  if (url.startsWith(src.href) && url.endsWith(".ts")) return next(url, { ...context, format: "module-typescript" });
  if (url.startsWith(src.href) && url.endsWith(".json")) return next(url, { ...context, importAttributes: { type: "json" } });
  return next(url, context);
}
