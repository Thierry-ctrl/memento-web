FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.33.0
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV NODE_ENV=production
RUN pnpm typecheck && pnpm --filter @workspace/memento build && pnpm --filter @workspace/api-server build
RUN pnpm --filter @workspace/api-server deploy --legacy --prod /runtime

FROM node:24-bookworm-slim AS api
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /runtime .
USER node
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]

FROM caddy:2-alpine AS web
COPY --from=build /app/artifacts/memento/dist/public /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
