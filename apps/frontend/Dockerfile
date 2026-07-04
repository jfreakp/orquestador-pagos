# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:20 AS build
WORKDIR /app

COPY . .
RUN npm install
RUN npx nx build frontend --configuration production

# ---- Final ----
FROM nginx:alpine AS final

COPY --from=build /app/dist/apps/frontend/browser /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
