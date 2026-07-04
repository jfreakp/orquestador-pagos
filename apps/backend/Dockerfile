# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:20 AS build
WORKDIR /app

COPY . .

# node:20 ships npm 10; package-lock.json was generated with npm 11 on the
# host, so `npm ci` rejects it as out of sync. `npm install` is used
# instead (loses the strict reproducibility of `ci`, acceptable here).
RUN npm install

RUN NODE_ENV=production npx nx build backend

RUN npx prisma generate --schema=libs/prisma/src/schema.prisma

# npm workspaces link local libs (@orquestador/*) as symlinks pointing
# outside node_modules (to libs/), which the final stage won't have.
# Dereference only those into real copies; every other symlink inside
# node_modules (node_modules/.bin/*, Prisma's co-located .wasm files) must
# stay untouched, or `prisma migrate deploy` fails with
# ENOENT prisma_schema_build_bg.wasm.
RUN cp -rL node_modules/@orquestador node_modules/@orquestador-resolved \
  && rm -rf node_modules/@orquestador \
  && mv node_modules/@orquestador-resolved node_modules/@orquestador

# ---- Final ----
FROM node:20-alpine AS final
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/libs/prisma/src/schema.prisma ./libs/prisma/src/schema.prisma
COPY --from=build /app/libs/prisma/src/migrations ./libs/prisma/src/migrations
COPY --from=build /app/libs/prisma/generated ./libs/prisma/generated
COPY apps/backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
