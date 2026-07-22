# Деплой

## Сервер

- **Host:** `ift.balkdalk1778.ru`
- **User:** `root`
- **Путь к проекту:** `/opt/ift-proxy`

## Быстрый деплой

```bash
# 1. Закоммить и запушь изменения
git add -A && git commit -m "your message" && git push

# 2. SSH на сервер, pull + rebuild + restart
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy && git pull && cd docker && docker compose up -d --build"
```

## По шагам

```bash
# Локально: коммит и пуш
git add -A
git commit -m "your message"
git push

# Сервер: подключиться
ssh root@ift.balkdalk1778.ru

# Сервер: обновить код и перезапустить
cd /opt/ift-proxy
git pull
cd docker
docker compose up -d --build
```

## Архитектура

| Сервис      | Порт | Описание                              |
|-------------|------|---------------------------------------|
| `docker-proxy`  | 3000 | Node.js proxy (esbuild, Hono)         |
| `docker-caddy`  | 80/443 | Caddy reverse proxy + file server   |

### Маршрутизация (Caddy)

| Matcher   | Пути                              | Backend                          |
|-----------|-----------------------------------|----------------------------------|
| `@auth`   | `/oauth2*`, `/oidc*`, `/v1/oauth2*` | `sso.if.test.vtb.ru`           |
| `@backend`| `/services*`, `/msa*`, `/async*`, `/processor*`, `/content*`, `/webauth*`, `/routing*` | `online.if.test.vtb.ru` |
| `@mf`     | `/mf*`                            | `s1-if.vtbgroup.com`             |
| `@hcms`   | `/projects*`                      | `h1-if.vtb.ru`                   |
| default   | всё остальное                     | `localhost:3000` (proxy)         |

### Статика

Файлы из `caddy-example/public/` монтируются в Caddy по `/public`.
Туда попадают модульные фрагменты (mf) и другие ассеты.

## Полезные команды

```bash
# Логи
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy/docker && docker compose logs -f proxy"
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy/docker && docker compose logs -f caddy"

# Статус
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy/docker && docker compose ps"

# Рестарт без rebuild
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy/docker && docker compose restart"

# Остановить
ssh root@ift.balkdalk1778.ru "cd /opt/ift-proxy/docker && docker compose down"
```
