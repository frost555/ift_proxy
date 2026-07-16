FROM caddy:2-alpine

USER root

COPY caddy-example/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--watch"]
