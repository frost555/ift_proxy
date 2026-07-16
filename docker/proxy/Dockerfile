# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app/proxy

COPY proxy/package.json proxy/package-lock.json ./
RUN npm ci

COPY proxy/src/ src/

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

USER root

WORKDIR /app

COPY --from=build /app/proxy/package.json /app/proxy/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/proxy/dist ./dist

ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]
