# Alonix IDP frontend — Vite build + nginx for Lightning Deployments
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ARG VITE_SOCKET_PATH=/socket.io

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_SOCKET_PATH=$VITE_SOCKET_PATH

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Transfer ownership to existing nginx user (nginx:1.27-alpine has nginx:nginx user/group)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/ || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
