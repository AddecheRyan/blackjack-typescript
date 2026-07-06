## Getting Started

All commands run from the repo root.

```bash
pnpm install

# development (backend on :4000, frontend on :3000)
pnpm dev

# production build (both packages)
pnpm build

# run production builds
pnpm start:backend
pnpm start:frontend
```

Per-package builds are also available: `pnpm build:backend` / `pnpm build:frontend`.

## Links to docs that helped with development

### MongoDB integration

https://oneuptime.com/blog/post/2026-03-31-mongodb-use-mongodb-with-nextjs-api-routes/view

https://www.mongodb.com/docs/drivers/node-frameworks/next-integration/

### Nextjs

#### API's that can be used with nextjs
https://nextjs.org/docs/app/api-reference/edge#network-apis

#### Setting up sessions + help with proxy.ts
https://nextjs.org/docs/app/guides/authentication

#### Web Sockets
https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

### Shadcn component docs

https://ui.shadcn.com/docs/components
