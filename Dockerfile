# syntax=docker/dockerfile:experimental
FROM node:20-alpine as builder
RUN mkdir -p /app/node_modules
# RUN chown -R node:node /app
# USER node
WORKDIR /home/node/app
COPY . /home/node/app/
RUN --mount=type=cache,target=/app/node_modules,id=otcweb_npm_module,sharing=locked \
    --mount=type=cache,target=/home/node/.npm,id=otcweb_npm_cache \
    npm install && npm run build

FROM nginx:stable-alpine

WORKDIR /app
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.template /etc/nginx/conf.d/default.template
COPY --from=builder /home/node/app/nginx-start.sh /app

RUN mkdir -p /var/www/html /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp

RUN --mount=type=cache,target=/tmp/dist,from=builder,source=/home/node/app/dist \
    cp -r /tmp/dist/* /var/www/html

## add permissions
RUN chown -R nginx:nginx /app && chmod -R 755 /app && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/www/html && \
    chown -R nginx:nginx /var/cache/nginx/ && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

HEALTHCHECK --interval=10s --timeout=8s \
  CMD curl -fs http://localhost:8088/ || exit 1

EXPOSE 8088
# ENV SERVICE_NAME=admin-web

USER nginx

ENTRYPOINT ["sh", "nginx-start.sh"]

