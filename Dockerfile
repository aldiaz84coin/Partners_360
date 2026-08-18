# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: postinstall runs `prisma generate`, which needs prisma/schema.prisma
# (not copied into this stage yet) — the builder stage below runs it explicitly instead.
RUN npm ci --ignore-scripts

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone server + static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The standalone output above ships its own node_modules, pruned to only what
# Next.js traced as imported by the server bundle — it does NOT include the
# Prisma CLI (and its many transitive deps) needed by `prisma migrate deploy`
# (fly.toml release_command) or `prisma db seed`. Replace it with the full,
# known-good node_modules from the builder so both the app and the CLI work.
RUN rm -rf ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
