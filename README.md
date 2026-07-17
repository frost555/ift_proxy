# IFT Proxy

Прокси-сервер для обхода проблем с SSL-сертификатами на целевом ресурсе `online.if.test.vtb.ru`.

## Проблема

На тестовом стенде VTB сертификаты могут быть самоподписанными или просроченными. Браузер блокирует HTTPS-запросы к таким ресурсам, делая разработку невозможной.

## Решение

Проект запускает локальный HTTPS-прокси на основе **Caddy**, который:

1. **Выдаёт валидный сертификат** для домена через Let's Encrypt (автоматическое получение и обновление)
2. **Проксирует запросы** к целевым серверам с `tls_insecure_skip_verify` — игнорируя проблемы с их сертификатами
3. **Генерирует динамический HTML** через Express-сервер, подтягивая актуальные настройки и манифесты с целевого сервера

```
                    ┌──────────────────────────────────────────────────┐
                    │              Клиент (браузер)                    │
                    │         доверяет сертификату Caddy              │
                    └──────────────────────┬───────────────────────────┘
                                           │ HTTPS (валидный сертификат)
                                           ▼
                    ┌──────────────────────────────────────────────────┐
                    │              Caddy (порт 80/443)                │
                    │                                                 │
                    │  /oauth2*, /oidc*        → SSO                 │
                    │  /services*, /msa*, ...  → Backend API         │
                    │  /mf*                    → CDN (static assets) │
                    │  /projects*              → HCMS                │
                    │  всё остальное           → Express-сервер      │
                    │                                                 │
                    └──────────────────┬──────────────────────────────┘
                                       │ HTTP (tls_insecure_skip_verify)
                                       ▼
                    ┌──────────────────────────────────────────────────┐
                    │         Целевые серверы (сломанные сертификаты)  │
                    │  https://sso.if.test.vtb.ru                     │
                    │  https://online.if.test.vtb.ru                  │
                    │  https://s1-if.vtbgroup.com                     │
                    │  https://h1-if.vtb.ru                           │
                    └──────────────────────────────────────────────────┘
```

## Архитектура

### Caddy — обратный прокси и HTTPS-терминация

Caddy — это веб-сервер с автоматическим HTTPS. Он стоит на входе и:
- Получает и обновляет TLS-сертификаты через ACME (Let's Encrypt / ZeroSSL)
- Маршрутизирует запросы по префиксам пути к разным бэкендам
- Подключает статические файлы из `caddy-example/public/` (шрифты, CSS, JS-конфиг)

Маршрутизация задаётся в `caddy-example/Caddyfile`:

| Префикс пути | Бэкенд | Назначение |
|---|---|---|
| `/oauth2*`, `/oidc*`, `/v1/oauth2*`, `/v2/oauth2*` | `sso.if.test.vtb.ru` | Авторизация (WSO2 / SSO) |
| `/services*`, `/msa*`, `/async*`, `/processor*`, `/content*`, `/webauth*`, `/routing*` | `online.if.test.vtb.ru` | Backend API |
| `/mf*` | `s1-if.vtbgroup.com` | Статические ассеты микрофронтендов |
| `/projects*` | `h1-if.vtb.ru` | HCMS (контент-менеджмент) |
| всё остальное | `localhost:3000` (Express-сервер) | Динамический HTML |

Все проксируемые подключения используют `tls_insecure_skip_verify` — это ключевой момент, позволяющий работать с серверами, у которых невалидные сертификаты.

### Express-сервер (Node.js) — динамическая генерация HTML

Генерирует стартовую HTML-страницу приложения.

**Почему нужен отдельный Express-сервер вместо статического HTML?**

Настройки приложения (`core-settings`) и версии микрофронтендов меняются. Express-сервер подтягивает их с целевого сервера и встраивает в HTML на лету.

**Как работает:**

1. **`fetchCoreSettings()`** — делает GET-запрос к `online.if.test.vtb.ru/msa/api-gw/core/core-settings-backend/params` и получает JSON с параметрами приложения
2. **`getIndexHtml(coreSettings)`** — на основе настроек:
   - Определяет версию модуля `mf_1488_core`
   - Загружает `assets-manifest.json` с CDN (`s1-if.vtbgroup.com`)
   - Формирует список JS-скриптов (`remoteEntry.js` + файлы из манифеста)
   - Патчит `vtbid_settings.parb_lock_orc_url = ""` для перенаправления запросов через локальный прокси
   - Возвращает HTML с `<script>`-тегами и `window._coreSettings`
3. **Кэширование** — результаты кэшируются на 1 час, чтобы не дергать бэкенд при каждом запросе

**`main.ts`** — CLI-скрипт для генерации статического HTML в `build/index.html` (для отладки).

### Статические файлы (`caddy-example/public/`)

| Файл | Назначение |
|---|---|
| `config.js` | Клиентская конфигурация (`vtb24Config`, `vtbConfig`, `vtbRFConfig`) с URL-ами сервисов, токенами SSO, настройками webchat и push-уведомлений |
| `fonts.css` | Подключение шрифтов |
| `fonts/` | Шрифты OmegaUI и VTB Group UI |
| `sdk-web.min.js` | SDK для работы с платформой |

## Структура проекта

```
├── docker/
│   ├── docker-compose.yml      # Оркестрация двух сервисов
│   ├── .env.example            # Переменные окружения (PORT)
│   ├── README.md               # Инструкции по развёртыванию
│   ├── caddy/
│   │   └── Dockerfile          # Caddy 2 на Alpine
│   └── proxy/
│       └── Dockerfile          # Node.js 20, двухэтапная сборка
├── proxy/
│   ├── src/
│   │   ├── main.ts             # CLI: генерация статического HTML
│   │   ├── server.ts           # Express-сервер с кэшированием
│   │   ├── fetchCoreSettings.ts # Запрос core-settings с бэкенда
│   │   └── getIndexHtml.ts     # Сборка HTML из настроек + манифеста
│   ├── package.json
│   └── tsconfig.json
├── caddy-example/
│   ├── Caddyfile               # Конфигурация маршрутизации Caddy
│   └── public/                 # Статические файлы (шрифты, CSS, JS)
│       ├── config.js
│       ├── fonts.css
│       ├── fonts/
│       └── sdk-web.min.js
└── README.md                   # Этот файл
```

## Быстрый старт

### Требования

- Docker Engine 24+
- Docker Compose v2
- Свободные порты 80 и 443 на хосте
- DNS-запись домена, указывающая на сервер (для автоматического HTTPS)

### Запуск

```bash
# 1. Клонировать и подготовить
git clone https://github.com/frost555/ift_proxy.git /opt/ift-proxy
cd /opt/ift-proxy
cp docker/.env.example docker/.env

# 2. Заменить домен в Caddyfile
#    caddy-example/Caddyfile: ift.balkdalk1778.ru → ваш-домен.ru

# 3. Собрать и запустить
cd docker
docker compose up --build -d
```

### Проверка

```bash
docker compose logs -f      # логи
docker compose ps            # статус контейнеров
```

### Остановка и очистка

```bash
docker compose down          # остановить
docker compose down -v       # остановить и удалить тома (сертификаты!)
```

### Обновление после изменений

```bash
cd /opt/ift-proxy
git pull
cd docker
docker compose up --build -d
```

Caddy перезагружает конфигурацию автоматически (флаг `--watch`), поэтому изменения в `Caddyfile` и статических файлах применяются без перезапуска.

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт Express-сервера |
