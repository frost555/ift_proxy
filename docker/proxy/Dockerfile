# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/

RUN npx tsc

# ---- Production stage ----
FROM node:20-alpine

USER root

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/src ./src
COPY --from=build /app/dist ./dist

ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
