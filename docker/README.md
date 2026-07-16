# Развёртывание через Docker

## Архитектура

```
Клиент → Caddy (порт 80/443)
           ├── /oauth2*, /oidc*, ...     → SSO (https://sso.if.test.vtb.ru)
           ├── /services*, /msa*, ...    → Backend (https://online.if.test.vtb.ru)
           ├── /projects*                → HCMS (https://h.if.vtb.ru)
           └── всё остальное             → proxy (localhost:3000)

proxy (Node.js, порт 3000)
```

Оба контейнера используют `network_mode: host` — они разделяют сетевой стек хоста и доступны по `localhost`.

## Требования

- Docker Engine 24+
- Docker Compose (v2)
- Свободные порты 80 и 443 на хосте
- Права root или sudo для Docker

## Перенос на сервер

Клонируйте репозиторий:

```bash
git clone https://github.com/<user>/<repo>.git /opt/ift-proxy
```

## Быстрый старт

Все команды выполняются на сервере из директории `/opt/ift-proxy`.

### 1. Подготовка

```bash
cd /opt/ift-proxy
cp docker/.env.example docker/.env
# отредактируйте docker/.env при необходимости (PORT=3000)
```

Замените `example.com` в `caddy-example/Caddyfile` на реальный домен.

### 2. Сборка и запуск

```bash
cd docker
docker compose up --build -d
```

### 3. Проверка статуса

```bash
# Посмотреть логи
docker compose logs -f

# Проверить статус контейнеров
docker compose ps
```

### 4. Остановка

```bash
docker compose down
```

### 5. Обновление после изменений кода

```bash
# Обновите репозиторий на сервере
cd /opt/ift-proxy
git pull

# Пересоберите и перезапустите
cd docker
docker compose up --build -d
```

## Обновление конфигурации Caddy

Caddyfile примонтирован из `caddy-example/Caddyfile` и запущен с флагом `--watch` — изменения в файле применяются автоматически без перезапуска контейнера.

Для ручного перезапуска:

```bash
docker compose restart caddy
```

## Управление данными

Сертификаты TLS и конфигурация Caddy сохраняются в именованных томах:

- `caddy-data` — данные (включая сертификаты)
- `caddy-config` — конфигурация

Для полной очистки:

```bash
docker compose down -v
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт Node.js прокси-сервера |
