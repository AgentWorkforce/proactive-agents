# Deploy Playbook Skill

Use this skill when reviewing, fixing, or shipping a build/deploy change in the `proactive-agents` repo. It is the canonical ledger of every deploy failure we have hit and how we keep them from recurring.

The repo deploys to **Cloudflare Pages** as a static export (`output: "export"` in `next.config.ts`). That constraint shapes every entry below: anything that requires a server at request time is not allowed, and every dynamic route must be fully enumerable at build time.

## How to use this skill

1. Read every entry below before approving a PR that touches `app/`, `next.config.ts`, `wrangler.toml`, or `.github/workflows/`.
2. Run `npx next build` locally. Do not rely on CI to find a failure that the playbook already predicts.
3. If the build fails with a mode that is **not** in this playbook, fix the root cause, then append a new entry to the "Failure modes" section before closing the task. The playbook is the persona's memory; an unrecorded failure will recur.
4. Never paper over a failure by deleting the failing route, disabling a check, or passing `--no-verify`. Fix the underlying constraint.

## Pre-merge checklist

Run this on every PR that touches build/deploy surface. All items must pass before approval.

- [ ] `npx next build` is green locally with the same Node version CI uses.
- [ ] Every `opengraph-image.tsx`, `twitter-image.tsx`, `icon.tsx`, and `apple-icon.tsx` declares `export const dynamic = "force-static"` directly in the file (not via re-export).
- [ ] Every dynamic-segment image route (under `app/**/[slug]/`) exports `generateStaticParams`.
- [ ] `next.config.ts` still has `output: "export"`, `trailingSlash: true`, and `images.unoptimized: true`.
- [ ] `wrangler.toml` still has `compatibility_flags = ["nodejs_compat"]`.
- [ ] The Cloudflare Pages deploy GitHub Action still pins `wrangler@4`.
- [ ] No new server actions, route handlers, middleware, ISR (`revalidate`), or `dynamic = "force-dynamic"` exports.
- [ ] Internal `<Link>` hrefs and canonical URLs end with a trailing slash to match `trailingSlash: true`.

## Failure modes

Each entry is structured as **Symptom / Scope / Fix / Prevention** so a future reader can map a red build to a known cause in seconds.

### 1. `output: export` requires `dynamic = "force-static"` on every image route

- **Symptom.** `Failed to collect page data for /.../opengraph-image` with the error: `export const dynamic = "force-static"/export const revalidate not configured on route "..." with "output: export"`.
- **Scope.** Every `opengraph-image.tsx`, `twitter-image.tsx`, `icon.tsx`, and `apple-icon.tsx` under `app/`. Affects both root-level and dynamic-segment variants. Static export cannot ship a route whose behavior is not statically known.
- **Fix.** Add `export const dynamic = "force-static"` directly in the route file. For files under a dynamic segment (`[slug]`), also add `export async function generateStaticParams()` so Next can enumerate the paths at build time.
- **Prevention.** Reject any new image route that does not declare `dynamic = "force-static"` in the same file it lives in.

### 2. Re-exported `dynamic` is not recognized

- **Symptom.** `Next.js can't recognize the exported \`dynamic\` field in route. It mustn't be reexported.`
- **Scope.** Any route file that uses `export { dynamic } from "./other-file"`. Common pattern when `twitter-image.tsx` is a thin shim around `opengraph-image.tsx`.
- **Fix.** Declare `export const dynamic = "force-static"` directly in each route file. You may still re-export `default`, `size`, `contentType`, and `generateStaticParams`, but `dynamic` must be a literal in the same module.
- **Prevention.** Shim files for sibling image routes (e.g., `twitter-image.tsx` next to `opengraph-image.tsx`) must declare `dynamic` themselves. Treat any `export { dynamic, ... } from ...` as a build break.

### 3. Server features incompatible with static export

- **Symptom.** Build error mentioning route handlers, server actions, middleware, or `revalidate` on a route while `output: "export"` is set.
- **Scope.** Anything that needs the server at request time: API route handlers (`route.ts`), server actions, `middleware.ts`, `export const dynamic = "force-dynamic"`, `export const revalidate = N`, `dynamicParams = true`.
- **Fix.** Remove the server-only construct or move the work to build time. If the use case truly needs runtime compute, raise the question explicitly — switching off `output: "export"` is a deploy-architecture change, not a fix.
- **Prevention.** PR review should flag any new `route.ts`, `middleware.ts`, `"use server"`, or `revalidate`/`dynamic = "force-dynamic"` export.

### 4. Cloudflare Pages Functions need `nodejs_compat`

- **Symptom.** Pages Functions throw at runtime with errors about missing Node built-ins (e.g., `Buffer`, `stream`, `crypto`).
- **Scope.** `wrangler.toml` and any Pages Functions used by the deploy (e.g., the Notion webhook). Pinned in commit `d38253f`.
- **Fix.** Ensure `compatibility_flags = ["nodejs_compat"]` is present in `wrangler.toml`.
- **Prevention.** Treat any PR that removes or comments out `nodejs_compat` as a blocking change.

### 5. Wrangler v3 in the Pages deploy action breaks the build

- **Symptom.** Pages deploy action fails on a flag or argument that exists in Wrangler v4 but not v3 (or vice versa). Pinned in commit `1e6f750`.
- **Scope.** `.github/workflows/` files that run `wrangler pages deploy`.
- **Fix.** Pin the action to `wrangler@4`. Do not let it float.
- **Prevention.** Block any PR that downgrades Wrangler or removes the pin.

## When you discover a new failure mode

Append a sixth entry (and onward) using the same Symptom / Scope / Fix / Prevention shape. Keep entries terse and concrete: a future reader should be able to skim, recognize their symptom, and find the fix in under thirty seconds. Do not duplicate context that is already in the pre-merge checklist; cross-reference it instead.
