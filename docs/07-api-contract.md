# API Contract Draft
## Логистическая CRM — MVP

**Версия:** 1.0  
**Статус:** Draft  
**Дата:** 20.03.2026  
**Документ:** API-001

---

## Содержание

1. [Общие положения](#1-общие-положения)
2. [Стандарты и конвенции](#2-стандарты-и-конвенции)
3. [Аутентификация и авторизация](#3-аутентификация-и-авторизация)
4. [Общие параметры](#4-общие-параметры)
5. [Ошибки и коды ответа](#5-ошибки-и-коды-ответа)
6. [Модуль "Заявки" (Requests)](#6-модуль-заявки-requests)
7. [Модуль "Заказы" (Orders)](#7-модуль-заказы-orders)
8. [Модуль "Рейсы" (Trips)](#8-модуль-рейсы-trips)
9. [Модуль "Клиенты" (Clients)](#9-модуль-клиенты-clients)
10. [Модуль "Транспорт" (Vehicles)](#10-модуль-транспорт-vehicles)
11. [Модуль "Водители" (Drivers)](#11-модуль-водители-drivers)
12. [Модуль "Пользователи" (Users)](#12-модуль-пользователи-users)
13. [Комментарии и история](#13-комментарии-и-история)
14. [Уведомления](#14-уведомления)
15. [Файлы и вложения](#15-файлы-и-вложения)
16. [Отчёты](#16-отчёты)

---

## 1. Общие положения

### 1.1 Базовый URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:3001/api/v1` |
| Staging | `https://api-staging.crm.logistics/api/v1` |
| Production | `https://api.crm.logistics/api/v1` |

### 1.2 Версионирование API

| Версия | Дата | Статус |
|--------|------|--------|
| v1 | 20.03.2026 | Current |
| v1 (deprecated) | — | — |

**Правила:**
- Текущая версия указывается в URL: `/api/v1/`
- При breaking changes — новая версия
- Старая версия работает 6 месяцев после deprecation

### 1.3 Content-Type

| Тип | Content-Type |
|-----|-------------|
| JSON | `application/json` |
| Multipart | `multipart/form-data` |
| Export | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

### 1.4 Формат даты/времени

| Формат | ISO 8601 | Пример |
|--------|----------|--------|
| Дата | `YYYY-MM-DD` | `2026-03-20` |
| Время | `HH:mm:ss` | `14:30:00` |
| Дата-время | `YYYY-MM-DDTHH:mm:ss.sssZ` | `2026-03-20T14:30:00.000Z` |

---

## 2. Стандарты и конвенции

### 2.1 REST-ресурсы

| Ресурс | Множественное число | Endpoint |
|---------|---------------------|----------|
| Заявка | requests | `/requests` |
| Заказ | orders | `/orders` |
| Рейс | trips | `/trips` |
| Клиент | clients | `/clients` |
| Транспорт | vehicles | `/vehicles` |
| Водитель | drivers | `/drivers` |
| Точка | points | `/points` |
| Пользователь | users | `/users` |
| Комментарий | comments | `/comments` |
| Файл | files | `/files` |

### 2.2 HTTP-методы

| Метод | Назначение | Идемпотентность | Тело запроса |
|--------|------------|-----------------|--------------|
| GET | Получение ресурса | Да | Нет |
| POST | Создание ресурса | Нет | Да |
| PUT | Полная замена ресурса | Да | Да |
| PATCH | Частичное обновление | Да | Да |
| DELETE | Удаление ресурса | Да | Нет |

### 2.3 Структура URL

```
/resources/{id}                    # Конкретный ресурс
/resources/{id}/sub-resources      # Подчинённые ресурсы
/resources/{id}/actions/{action}   # Действия
```

**Примеры:**
```
GET  /requests/{id}                    # Получить заявку
GET  /requests/{id}/comments           # Комментарии заявки
POST /requests/{id}/change-status      # Изменить статус заявки
POST /requests/{id}/clone              # Клонировать заявку
```

### 2.4 Параметры пути (Path Parameters)

| Параметр | Описание | Пример |
|----------|---------|--------|
| `{id}` | UUID ресурса | `550e8400-e29b-41d4-a716-446655440000` |
| `{uuid}` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| `{action}` | Название действия | `change-status`, `clone` |

---

## 3. Аутентификация и авторизация

### 3.1 Типы аутентификации

| Тип | Использование | Заголовок |
|-----|---------------|-----------|
| Bearer Token (JWT) | Все API запросы | `Authorization: Bearer <token>` |
| API Key | Внешние интеграции | `X-API-Key: <key>` |

### 3.2 JWT Token

| Параметр | Значение |
|----------|---------|
| Algorithm | RS256 |
| Issuer | `https://crm.logistics` |
| Audience | `crm-api` |
| Expiration | 1 час |
| Refresh Token | 7 дней |

### 3.3 Права доступа в JWT

```json
{
  "sub": "user-uuid",
  "email": "user@company.ru",
  "roles": ["DISPATCHER"],
  "filial_id": "filial-uuid",
  "scope": "FILIAL",
  "permissions": [
    "requests.create",
    "requests.read",
    "requests.update",
    "trips.create",
    "trips.read"
  ],
  "exp": 1679318400
}
```

### 3.4 Заголовки запроса

| Заголовок | Обязательность | Описание |
|-----------|----------------|---------|
| Authorization | Да | `Bearer <token>` |
| Content-Type | Да (POST/PUT/PATCH) | `application/json` |
| Accept | Рекомендуется | `application/json` |
| X-Request-ID | Рекомендуется | UUID для трассировки |
| X-Timezone | Нет | Часовой пояс клиента |

---

## 4. Общие параметры

### 4.1 Пагинация

**Query-параметры:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|---------|
| page | integer | 1 | Номер страницы |
| per_page | integer | 20 | Элементов на страницу (max: 100) |
| offset | integer | 0 | Смещение (альтернатива page) |
| limit | integer | 20 | Лимит (альтернатива per_page) |

**Response Headers:**

| Заголовок | Описание |
|-----------|---------|
| X-Total-Count | Общее количество записей |
| X-Total-Pages | Всего страниц |
| X-Current-Page | Текущая страница |
| X-Per-Page | Элементов на странице |
| Link | Ссылки на first, prev, next, last |

**Пример:**
```
GET /requests?page=2&per_page=20

X-Total-Count: 342
X-Total-Pages: 18
X-Current-Page: 2
X-Per-Page: 20
Link: <http://api/v1/requests?page=1>; rel="first",
      <http://api/v1/requests?page=1>; rel="prev",
      <http://api/v1/requests?page=3>; rel="next",
      <http://api/v1/requests?page=18>; rel="last"
```

### 4.2 Сортировка

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| sort | string | Поле для сортировки |
| order | string | `asc` или `desc` |

**Примеры:**
```
GET /requests?sort=created_at&order=desc
GET /requests?sort=status,created_at&order=asc,desc
```

**Разрешённые поля для сортировки** (по модулям):

| Модуль | Разрешённые поля |
|--------|-------------------|
| requests | `id`, `number`, `status`, `priority`, `created_at`, `updated_at`, `client_id` |
| orders | `id`, `number`, `status`, `total`, `created_at`, `client_id` |
| trips | `id`, `number`, `status`, `planned_start`, `actual_start`, `driver_id` |
| clients | `id`, `name`, `inn`, `created_at` |

### 4.3 Фильтрация

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| filter[{field}] | string | Фильтр по полю |
| search | string | Полнотекстовый поиск |
| date_from | date | Фильтр по дате (от) |
| date_to | date | Фильтр по дате (до) |

**Операторы:**

| Оператор | Пример | Описание |
|---------|--------|---------|
| (default) | `status=new` | Точное совпадение |
| `,` | `status=new,calculating` | IN (несколько значений) |
| `>` | `total=gt:1000` | Больше |
| `<` | `total=lt:50000` | Меньше |
| `>=` | `total=gte:1000` | Больше или равно |
| `<=` | `total=lte:50000` | Меньше или равно |
| `like` | `name=like:ООО` | Содержит |
| `null` | `deleted_at=null` | IS NULL |
| `!null` | `deleted_at=!null` | IS NOT NULL |

**Примеры:**
```
GET /requests?filter[status]=new
GET /requests?filter[status]=new,calculating&filter[priority]=urgent
GET /requests?search=Москва
GET /requests?date_from=2026-03-01&date_to=2026-03-31
GET /requests?filter[client_id]=uuid&sort=created_at&order=desc
```

### 4.4 Включение связанных данных (Include)

**Query-параметры:**

| Параметр | Описание |
|----------|---------|
| include | Список связанных ресурсов через запятую |

**Примеры:**
```
GET /requests/{id}?include=client,assigned_to
GET /requests?include=client,trips.driver,trips.vehicle
```

**Разрешённые includes:**

| Ресурс | Доступные includes |
|---------|-------------------|
| requests | `client`, `assigned_to`, `created_by`, `contract`, `order`, `trips`, `points`, `cargo_items` |
| orders | `client`, `contract`, `created_by`, `assigned_to`, `items` |
| trips | `driver`, `vehicle`, `request`, `checkpoints`, `assigned_by` |
| clients | `contracts`, `created_by` |

---

## 5. Ошибки и коды ответа

### 5.1 HTTP Status Codes

| Код | Название | Описание | Пример использования |
|-----|----------|----------|----------------------|
| 200 | OK | Успешный запрос | GET, PUT, PATCH |
| 201 | Created | Ресурс создан | POST |
| 204 | No Content | Успешно, без тела | DELETE |
| 400 | Bad Request | Ошибка валидации | Некорректные параметры |
| 401 | Unauthorized | Не авторизован | Отсутствует токен |
| 403 | Forbidden | Нет прав | Нет доступа к ресурсу |
| 404 | Not Found | Ресурс не найден | Несуществующий ID |
| 409 | Conflict | Конфликт | Дублирование, нарушение целостности |
| 422 | Unprocessable Entity | Бизнес-правила | Нарушение workflow |
| 429 | Too Many Requests | Rate limit | Превышен лимит запросов |
| 500 | Internal Server Error | Серверная ошибка | — |

### 5.2 Структура Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "details": [
      {
        "field": "weight",
        "code": "REQUIRED",
        "message": "Вес обязателен для заполнения"
      },
      {
        "field": "weight",
        "code": "MIN_VALUE",
        "message": "Вес должен быть больше 0"
      }
    ],
    "request_id": "req-uuid-12345"
  }
}
```

### 5.3 Коды ошибок

| Код | HTTP | Описание |
|-----|------|----------|
| VALIDATION_ERROR | 400 | Ошибка валидации полей |
| INVALID_FORMAT | 400 | Неверный формат данных |
| INVALID_PARAMETER | 400 | Недопустимый параметр |
| UNAUTHORIZED | 401 | Не авторизован |
| TOKEN_EXPIRED | 401 | Токен истёк |
| TOKEN_INVALID | 401 | Невалидный токен |
| FORBIDDEN | 403 | Нет прав на действие |
| PERMISSION_DENIED | 403 | Отсутствует permission |
| NOT_FOUND | 404 | Ресурс не найден |
| ALREADY_EXISTS | 409 | Ресурс уже существует |
| CONFLICT_STATE | 409 | Конфликт состояния |
| INVALID_STATUS_TRANSITION | 422 | Недопустимый переход статуса |
| BUSINESS_RULE_VIOLATION | 422 | Нарушение бизнес-правил |
| RATE_LIMIT_EXCEEDED | 429 | Превышен лимит |
| INTERNAL_ERROR | 500 | Внутренняя ошибка сервера |

### 5.4 Rate Limiting

| Tier | Лимит | Окно |
|------|-------|------|
| Default | 1000 | 15 минут |
| Export | 10 | 1 минута |
| Auth | 5 | 1 минута |

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1679318500
```

---

## 6. Модуль "Заявки" (Requests)

### 6.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/requests` | Список заявок |
| GET | `/requests/{id}` | Детали заявки |
| POST | `/requests` | Создание заявки |
| PUT | `/requests/{id}` | Полное обновление |
| PATCH | `/requests/{id}` | Частичное обновление |
| DELETE | `/requests/{id}` | Удаление заявки |
| POST | `/requests/{id}/change-status` | Изменение статуса |
| POST | `/requests/{id}/clone` | Клонирование |
| POST | `/requests/{id}/cancel` | Отмена заявки |
| GET | `/requests/{id}/points` | Точки маршрута |
| POST | `/requests/{id}/points` | Добавление точки |
| GET | `/requests/{id}/cargo-items` | Позиции груза |
| POST | `/requests/{id}/cargo-items` | Добавление позиции |
| GET | `/requests/{id}/trips` | Связанные рейсы |
| GET | `/requests/{id}/status-history` | История статусов |
| GET | `/requests/{id}/comments` | Комментарии |
| POST | `/requests/{id}/comments` | Добавление комментария |
| GET | `/requests/{id}/files` | Файлы |
| POST | `/requests/{id}/files` | Загрузка файла |

---

### 6.2 GET /requests — Список заявок

**Описание:** Получение списка заявок с фильтрацией и пагинацией.

**Авторизация:** Требуется JWT. Право: `requests.read`

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| page | integer | Номер страницы |
| per_page | integer | Элементов на странице (max: 100) |
| sort | string | Поле сортировки |
| order | string | `asc` или `desc` |
| filter[status] | string | Фильтр по статусу (через запятую) |
| filter[priority] | string | Фильтр по приоритету |
| filter[client_id] | uuid | Фильтр по клиенту |
| filter[type] | string | Тип перевозки (auto/railway/multimodal) |
| filter[assigned_to] | uuid | Фильтр по ответственному |
| date_from | date | Дата создания (от) |
| date_to | date | Дата создания (до) |
| search | string | Поиск по номеру, клиенту |
| include | string | Связанные данные |
| fields | string | Какие поля включить |

**Request:**
```
GET /api/v1/requests?page=1&per_page=20&filter[status]=new,calculating&include=client,assigned_to
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "number": "REQ-2026-0042",
      "status": "new",
      "status_display": "Новая",
      "type": "auto",
      "priority": "urgent",
      "total_weight": 2500,
      "total_volume": 8,
      "client": {
        "id": "uuid",
        "name": "ООО ТрансЛогистика"
      },
      "assigned_to": {
        "id": "uuid",
        "name": "Петров Иван"
      },
      "created_at": "2026-03-20T09:15:00.000Z",
      "updated_at": "2026-03-20T09:15:00.000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 342,
    "total_pages": 18
  },
  "links": {
    "first": "/requests?page=1",
    "last": "/requests?page=18",
    "prev": null,
    "next": "/requests?page=2"
  }
}
```

---

### 6.3 GET /requests/{id} — Детали заявки

**Описание:** Получение полной информации о заявке.

**Авторизация:** Требуется JWT. Право: `requests.read`

**Path-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| id | uuid | ID заявки |

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| include | string | Связанные данные |
| fields | string | Какие поля включить |

**Request:**
```
GET /api/v1/requests/550e8400-e29b-41d4-a716-446655440000?include=client,points,cargo_items,trips
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": "REQ-2026-0042",
    "type": "auto",
    "priority": "urgent",
    "status": "in_progress",
    "status_display": "В работе",
    "status_changed_at": "2026-03-20T15:00:00.000Z",
    
    "client": {
      "id": "uuid",
      "name": "ООО ТрансЛогистика",
      "inn": "7701234567",
      "phone": "+7 999 123-45-67"
    },
    
    "contract": {
      "id": "uuid",
      "number": "ДГ-2026-0012",
      "date_to": "2026-12-31"
    },
    
    "order": {
      "id": "uuid",
      "number": "ORD-2026-0012",
      "total": 45000,
      "status": "paid"
    },
    
    "assigned_to": {
      "id": "uuid",
      "name": "Петров Иван",
      "email": "petrov@company.ru"
    },
    
    "created_by": {
      "id": "uuid",
      "name": "Иванов Алексей"
    },
    
    "cargo_type": {
      "id": "uuid",
      "name": "Генеральный груз"
    },
    
    "total_weight": 2500,
    "total_volume": 8,
    "total_pieces": 24,
    
    "flags": {
      "urgent": true,
      "fragile": false,
      "oversize": true,
      "temp_controlled": true,
      "temp_min": 2,
      "temp_max": 8,
      "hazmat": false,
      "express": false
    },
    
    "vehicle_requirements": {
      "body_type": "van",
      "min_capacity_kg": 3000,
      "min_volume_m3": 10,
      "temperature_from": 2,
      "temperature_to": 8,
      "require_top_loading": false,
      "require_side_loading": false,
      "require_open_top": false
    },
    
    "points": [
      {
        "id": "uuid",
        "type": "loading",
        "sequence": 1,
        "address": "Москва, ул. Промышленная, 15",
        "city": "Москва",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "planned_date": "2026-03-25",
        "planned_time_from": "08:00",
        "planned_time_to": "10:00",
        "actual_arrival": "2026-03-25T08:15:00.000Z",
        "actual_departure": "2026-03-25T09:30:00.000Z",
        "contact_name": "Иванов Сергей",
        "contact_phone": "+7 999 123-45-67"
      },
      {
        "id": "uuid",
        "type": "unloading",
        "sequence": 2,
        "address": "Санкт-Петербург, ул. Приморская, 42",
        "city": "Санкт-Петербург",
        "latitude": 59.9343,
        "longitude": 30.3351,
        "planned_date": "2026-03-26",
        "planned_time_from": "14:00",
        "planned_time_to": "20:00",
        "actual_arrival": null,
        "actual_departure": null,
        "contact_name": "Петрова Ольга",
        "contact_phone": "+7 812 987-65-43"
      }
    ],
    
    "cargo_items": [
      {
        "id": "uuid",
        "description": "Электроника в упаковке",
        "weight": 2500,
        "volume": 8,
        "pieces": 24,
        "package_type": "pallet",
        "is_fragile": false
      }
    ],
    
    "trips": [
      {
        "id": "uuid",
        "number": "TRP-2026-0038",
        "status": "in_transit",
        "status_display": "В пути",
        "driver": {
          "id": "uuid",
          "name": "Сидоров Алексей"
        },
        "vehicle": {
          "id": "uuid",
          "plate_number": "А123АА 77"
        }
      }
    ],
    
    "has_active_trips": true,
    
    "created_at": "2026-03-20T09:15:00.000Z",
    "updated_at": "2026-03-20T15:00:00.000Z",
    
    "permissions": {
      "can_edit": true,
      "can_delete": false,
      "can_change_status": true,
      "can_create_trip": false,
      "can_cancel": true,
      "can_clone": true
    }
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Заявка не найдена",
    "request_id": "req-uuid-12345"
  }
}
```

**Response 403:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "У вас нет прав для просмотра этой заявки",
    "request_id": "req-uuid-12345"
  }
}
```

---

### 6.4 POST /requests — Создание заявки

**Описание:** Создание новой заявки на перевозку.

**Авторизация:** Требуется JWT. Право: `requests.create`

**Request Body:**
```json
{
  "type": "auto",
  "priority": "urgent",
  "client_id": "uuid",
  "contract_id": "uuid",
  
  "cargo_type_id": "uuid",
  "total_weight": 2500,
  "total_volume": 8,
  "total_pieces": 24,
  
  "flags": {
    "urgent": true,
    "fragile": false,
    "temp_controlled": true,
    "temp_min": 2,
    "temp_max": 8
  },
  
  "vehicle_requirements": {
    "body_type": "van",
    "min_capacity_kg": 3000,
    "min_volume_m3": 10,
    "temperature_from": 2,
    "temperature_to": 8
  },
  
  "points": [
    {
      "type": "loading",
      "sequence": 1,
      "address": "Москва, ул. Промышленная, 15",
      "city": "Москва",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "planned_date": "2026-03-25",
      "planned_time_from": "08:00",
      "planned_time_to": "10:00",
      "contact_name": "Иванов Сергей",
      "contact_phone": "+7 999 123-45-67"
    },
    {
      "type": "unloading",
      "sequence": 2,
      "address": "Санкт-Петербург, ул. Приморская, 42",
      "city": "Санкт-Петербург",
      "planned_date": "2026-03-26",
      "planned_time_from": "14:00",
      "planned_time_to": "20:00",
      "contact_name": "Петрова Ольга",
      "contact_phone": "+7 812 987-65-43"
    }
  ],
  
  "cargo_items": [
    {
      "description": "Электроника",
      "weight": 2500,
      "volume": 8,
      "pieces": 24,
      "package_type": "pallet"
    }
  ],
  
  "assigned_to": "uuid",
  "notes": "Срочная доставка для клиента VIP"
}
```

**Обязательные поля:**

| Поле | Тип | Валидация |
|------|-----|----------|
| type | enum | `auto`, `railway`, `multimodal` |
| priority | enum | `normal`, `urgent`, `express` |
| client_id | uuid | Существующий клиент |
| points | array | Минимум 2 точки |
| points[].type | enum | `loading`, `unloading` |
| points[].address | string | 1-500 символов |
| points[].city | string | 1-200 символов |
| points[].planned_date | date | YYYY-MM-DD |

**Response 201:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": "REQ-2026-0043",
    "status": "new",
    "status_display": "Новая",
    "type": "auto",
    "priority": "urgent",
    "client_id": "uuid",
    "created_at": "2026-03-20T16:00:00.000Z",
    "updated_at": "2026-03-20T16:00:00.000Z"
  },
  "meta": {
    "message": "Заявка успешно создана"
  }
}
```

**Response 400:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "details": [
      {
        "field": "points",
        "code": "MIN_ITEMS",
        "message": "Минимум 2 точки маршрута"
      },
      {
        "field": "client_id",
        "code": "REQUIRED",
        "message": "Клиент обязателен"
      }
    ]
  }
}
```

---

### 6.5 PATCH /requests/{id} — Частичное обновление

**Описание:** Обновление отдельных полей заявки.

**Авторизация:** Требуется JWT. Право: `requests.update`

**Request Body (пример):**
```json
{
  "priority": "normal",
  "flags": {
    "urgent": false
  },
  "assigned_to": "new-uuid"
}
```

**Разрешённые поля для обновления по статусу:**

| Статус | Разрешено изменять |
|--------|-------------------|
| new | Все поля кроме type, client_id |
| calculating | Все поля кроме type, client_id |
| offered | Примечание, флаги |
| confirmed | Флаги, notes |
| in_progress | Флаги, notes |
| completed | — |
| cancelled | — |

**Response 200:** Возвращает обновлённый ресурс (формат аналогичен GET /requests/{id})

---

### 6.6 POST /requests/{id}/change-status — Изменение статуса

**Описание:** Изменение статуса заявки.

**Авторизация:** Требуется JWT. Право: `requests.status.change`

**Request Body:**
```json
{
  "status": "in_progress",
  "comment": "Назначен рейс TRP-2026-0038"
}
```

**Валидация:**
- `status` должен быть допустимым переходом
- Для `cancelled` — `comment` обязателен (причина)

**Допустимые переходы:**

| Текущий | Доступно |
|---------|----------|
| new | calculating, cancelled |
| calculating | offered, cancelled |
| offered | confirmed, calculating, cancelled |
| confirmed | in_progress, cancelled |
| in_progress | completed, cancelled |
| completed | — |
| cancelled | — |

**Response 200:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "status_display": "В работе",
    "status_changed_at": "2026-03-20T15:00:00.000Z",
    "status_changed_by": {
      "id": "uuid",
      "name": "Петров Иван"
    }
  }
}
```

**Response 422:**
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Недопустимый переход статуса",
    "details": {
      "current_status": "new",
      "requested_status": "in_progress",
      "allowed_transitions": ["calculating", "cancelled"]
    }
  }
}
```

---

### 6.7 POST /requests/{id}/clone — Клонирование

**Описание:** Создание копии заявки.

**Авторизация:** Требуется JWT. Право: `requests.clone`

**Request Body:** Пустой или с переопределением полей
```json
{
  "planned_date_offset_days": 7,
  "priority": "normal"
}
```

**Response 201:** Возвращает новую заявку (аналогично POST /requests)

---

### 6.8 POST /requests/{id}/cancel — Отмена заявки

**Описание:** Отмена заявки.

**Авторизация:** Требуется JWT. Право: `requests.cancel`

**Request Body:**
```json
{
  "reason": "Клиент отказался от перевозки",
  "notify_client": true
}
```

**Валидация:**
- `reason` обязателен (мин. 10 символов)
- Если есть активные рейсы — требуется подтверждение

**Response 200:** Возвращает обновлённый ресурс

---

### 6.9 GET /requests/{id}/status-history — История статусов

**Описание:** Получение истории изменений статусов заявки.

**Авторизация:** Требуется JWT. Право: `requests.read`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "new",
      "status_display": "Новая",
      "changed_by": {
        "id": "uuid",
        "name": "Иванов Алексей"
      },
      "changed_at": "2026-03-20T09:15:00.000Z",
      "comment": null
    },
    {
      "id": "uuid",
      "status": "calculating",
      "status_display": "Расчёт",
      "changed_by": {
        "id": "uuid",
        "name": "Система"
      },
      "changed_at": "2026-03-20T09:30:00.000Z",
      "comment": null
    },
    {
      "id": "uuid",
      "status": "offered",
      "status_display": "Предложена",
      "changed_by": {
        "id": "uuid",
        "name": "Иванов Алексей"
      },
      "changed_at": "2026-03-20T10:00:00.000Z",
      "comment": "Отправлено предложение клиенту"
    }
  ]
}
```

---

## 7. Модуль "Заказы" (Orders)

### 7.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/orders` | Список заказов |
| GET | `/orders/{id}` | Детали заказа |
| POST | `/orders` | Создание заказа |
| PUT | `/orders/{id}` | Полное обновление |
| PATCH | `/orders/{id}` | Частичное обновление |
| DELETE | `/orders/{id}` | Удаление заказа |
| POST | `/orders/{id}/items` | Добавление позиции |
| PUT | `/orders/{id}/items/{item_id}` | Обновление позиции |
| DELETE | `/orders/{id}/items/{item_id}` | Удаление позиции |
| POST | `/orders/{id}/payments` | Регистрация платежа |
| POST | `/orders/{id}/send` | Отправка клиенту |
| POST | `/orders/{id}/approve` | Согласование |
| GET | `/orders/{id}/payments` | История платежей |
| GET | `/orders/{id}/status-history` | История статусов |

---

### 7.2 GET /orders/{id} — Детали заказа

**Авторизация:** Требуется JWT. Право: `orders.read`

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "number": "ORD-2026-0012",
    "client": {
      "id": "uuid",
      "name": "ООО ТрансЛогистика",
      "inn": "7701234567"
    },
    "contract": {
      "id": "uuid",
      "number": "ДГ-2026-0012"
    },
    "order_date": "2026-03-20",
    "subtotal": 37500,
    "vat_rate": 20,
    "vat_amount": 7500,
    "total": 45000,
    "paid_amount": 45000,
    "payment_status": "paid",
    "status": "paid",
    "status_display": "Оплачен",
    "payment_type": "postpay_14",
    "payment_deadline": "2026-04-03",
    "items": [
      {
        "id": "uuid",
        "description": "Перевозка Москва-СПб",
        "quantity": 1,
        "unit": "услуга",
        "price_per_unit": 35000,
        "total": 35000,
        "vat_rate": 20
      },
      {
        "id": "uuid",
        "description": "Упаковка в паллеты",
        "quantity": 24,
        "unit": "шт",
        "price_per_unit": 104.17,
        "total": 2500,
        "vat_rate": 20
      }
    ],
    "created_by": {
      "id": "uuid",
      "name": "Иванов Алексей"
    },
    "assigned_to": {
      "id": "uuid",
      "name": "Сидорова Мария"
    },
    "created_at": "2026-03-20T09:00:00.000Z",
    "updated_at": "2026-03-20T14:00:00.000Z",
    "permissions": {
      "can_edit": true,
      "can_delete": false,
      "can_send": false,
      "can_approve": false,
      "can_add_payment": true
    }
  }
}
```

---

### 7.3 POST /orders/{id}/payments — Регистрация платежа

**Авторизация:** Требуется JWT. Право: `orders.update`

**Request Body:**
```json
{
  "amount": 45000,
  "payment_date": "2026-03-19",
  "payment_method": "bank_transfer",
  "document_number": "П-2026-0015",
  "document_url": "https://storage.crm/doc.pdf",
  "notes": "Оплата по счёту №123"
}
```

**Валидация:**
- `amount` > 0
- `amount` ≤ (total - paid_amount)
- `payment_date` ≤ today

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "order_id": "uuid",
    "amount": 45000,
    "payment_date": "2026-03-19",
    "payment_method": "bank_transfer",
    "status": "confirmed",
    "created_at": "2026-03-20T10:00:00.000Z"
  },
  "meta": {
    "new_payment_status": "paid",
    "remaining_amount": 0
  }
}
```

---

## 8. Модуль "Рейсы" (Trips)

### 8.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/trips` | Список рейсов |
| GET | `/trips/{id}` | Детали рейса |
| POST | `/trips` | Создание рейса |
| PUT | `/trips/{id}` | Обновление рейса |
| DELETE | `/trips/{id}` | Удаление рейса |
| POST | `/trips/{id}/change-status` | Изменение статуса |
| POST | `/trips/{id}/close` | Закрытие рейса |
| POST | `/trips/{id}/cancel` | Отмена рейса |
| GET | `/trips/{id}/checkpoints` | Контрольные точки |
| POST | `/trips/{id}/checkpoints` | Добавление точки |
| PATCH | `/trips/{id}/checkpoints/{checkpoint_id}` | Обновление точки |
| GET | `/trips/{id}/status-history` | История статусов |

---

### 8.2 GET /trips/{id} — Детали рейса

**Авторизация:** Требуется JWT. Право: `trips.read`

**Query-параметры:**
```
GET /api/v1/trips/{id}?include=request,driver,vehicle,checkpoints
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "number": "TRP-2026-0038",
    "request": {
      "id": "uuid",
      "number": "REQ-2026-0042",
      "status": "in_progress"
    },
    "vehicle": {
      "id": "uuid",
      "plate_number": "А123АА 77",
      "brand": "КАМАЗ",
      "body_type": "van",
      "capacity_kg": 5000,
      "capacity_m3": 20
    },
    "driver": {
      "id": "uuid",
      "name": "Сидоров Алексей",
      "phone": "+7 999 123-45-67",
      "license_category": "CE"
    },
    "status": "in_transit",
    "status_display": "В пути",
    
    "planned_start": "2026-03-25T08:00:00.000Z",
    "actual_start": "2026-03-25T08:15:00.000Z",
    "planned_end": "2026-03-26T18:00:00.000Z",
    "actual_end": null,
    
    "planned_distance": 720,
    "actual_distance": 350,
    "planned_duration": 1680,
    "actual_duration": 435,
    
    "delay_minutes": 0,
    "delay_reason": null,
    
    "checkpoints": [
      {
        "id": "uuid",
        "type": "departure",
        "sequence": 1,
        "name": "Выезд со склада Москва",
        "address": "Москва, ул. Промышленная, 15",
        "planned_time": "2026-03-25T08:00:00.000Z",
        "actual_time": "2026-03-25T08:15:00.000Z",
        "is_completed": true,
        "completed_at": "2026-03-25T08:15:00.000Z",
        "latitude": 55.7558,
        "longitude": 37.6173,
        "notes": null
      },
      {
        "id": "uuid",
        "type": "transit",
        "sequence": 2,
        "name": "Тверь - остановка",
        "planned_time": "2026-03-25T14:30:00.000Z",
        "actual_time": "2026-03-25T14:28:00.000Z",
        "is_completed": true,
        "completed_at": "2026-03-25T14:28:00.000Z"
      }
    ],
    
    "assigned_by": {
      "id": "uuid",
      "name": "Петров Иван"
    },
    
    "created_at": "2026-03-20T15:00:00.000Z",
    "updated_at": "2026-03-25T14:28:00.000Z",
    
    "permissions": {
      "can_edit": true,
      "can_delete": false,
      "can_change_status": true,
      "can_close": false,
      "can_cancel": true
    }
  }
}
```

---

### 8.3 POST /trips — Создание рейса

**Описание:** Создание рейса (из заявки или с нуля).

**Авторизация:** Требуется JWT. Право: `trips.create`

**Request Body:**
```json
{
  "request_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "planned_start": "2026-03-25T08:00:00.000Z",
  "planned_end": "2026-03-26T18:00:00.000Z",
  "checkpoints": [
    {
      "type": "departure",
      "sequence": 1,
      "name": "Погрузка",
      "address": "Москва, ул. Промышленная, 15",
      "planned_time": "2026-03-25T08:00:00.000Z",
      "latitude": 55.7558,
      "longitude": 37.6173
    },
    {
      "type": "arrival",
      "sequence": 2,
      "name": "Выгрузка",
      "address": "Санкт-Петербург, ул. Приморская, 42",
      "planned_time": "2026-03-26T18:00:00.000Z",
      "latitude": 59.9343,
      "longitude": 30.3351
    }
  ],
  "notes": "Рейс для заявки REQ-2026-0042"
}
```

**Валидация:**
- `vehicle_id` — транспорт должен быть available
- `driver_id` — водитель должен быть available
- `vehicle_id` и `driver_id` не должны быть заняты в пересекающееся время
- Если `request_id` указан — проверяется статус и требования

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "number": "TRP-2026-0039",
    "status": "scheduled",
    "status_display": "Запланирован",
    "request_id": "uuid",
    "vehicle_id": "uuid",
    "driver_id": "uuid",
    "planned_start": "2026-03-25T08:00:00.000Z",
    "planned_end": "2026-03-26T18:00:00.000Z",
    "created_at": "2026-03-20T16:00:00.000Z"
  },
  "meta": {
    "message": "Рейс успешно создан"
  }
}
```

---

### 8.4 POST /trips/{id}/change-status — Изменение статуса рейса

**Авторизация:** Требуется JWT. Право: `trips.status.change`

**Request Body:**
```json
{
  "status": "in_transit",
  "comment": "Водитель выехал"
}
```

**Допустимые переходы:**

| Текущий | Доступно |
|---------|----------|
| scheduled | departed, cancelled |
| departed | in_transit, cancelled |
| in_transit | loading, unloading, problem, cancelled |
| loading | in_transit |
| unloading | completed |
| problem | in_transit, cancelled |
| completed | — |
| cancelled | — |

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "status": "in_transit",
    "status_display": "В пути",
    "actual_start": "2026-03-25T08:15:00.000Z"
  }
}
```

---

### 8.5 POST /trips/{id}/checkpoints/{checkpoint_id}/complete — Отметка точки

**Авторизация:** Требуется JWT. Право: `trips.update` или `trips.status.change`

**Request Body:**
```json
{
  "actual_time": "2026-03-25T14:28:00.000Z",
  "notes": "Остановка на заправке",
  "latitude": 56.8635,
  "longitude": 35.9245,
  "photo_url": "https://storage.crm/photo.jpg"
}
```

**Валидация:**
- Предыдущая точка должна быть завершена
- `actual_time` ≥ planned_time - grace_period
- Если checkpoint.type = 'arrival' → автозакрытие рейса

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "is_completed": true,
    "actual_time": "2026-03-25T14:28:00.000Z",
    "completed_at": "2026-03-25T14:28:00.000Z"
  }
}
```

---

## 9. Модуль "Клиенты" (Clients)

### 9.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/clients` | Список клиентов |
| GET | `/clients/{id}` | Детали клиента |
| POST | `/clients` | Создание клиента |
| PUT | `/clients/{id}` | Обновление клиента |
| PATCH | `/clients/{id}` | Частичное обновление |
| DELETE | `/clients/{id}` | Удаление клиента |
| GET | `/clients/{id}/contracts` | Договоры клиента |
| GET | `/clients/{id}/requests` | Заявки клиента |
| GET | `/clients/{id}/orders` | Заказы клиента |

---

### 9.2 GET /clients/{id} — Детали клиента

**Авторизация:** Требуется JWT. Право: `clients.read`

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "type": "legal",
    "name": "ООО ТрансЛогистика",
    "inn": "7701234567",
    "kpp": "770101001",
    "ogrn": "1027700132195",
    "legal_address": "Москва, ул. Примерная, д. 1",
    "postal_address": "Санкт-Петербург, ул. Примерная, д. 2",
    "phone": "+7 999 123-45-67",
    "email": "info@translog.ru",
    "website": "https://translog.ru",
    "contact_name": "Иванов Сергей",
    "contact_phone": "+7 999 123-45-67",
    "contact_email": "ivanov@translog.ru",
    "client_group": "vip",
    "credit_limit": 500000,
    "payment_days": 14,
    "filial": {
      "id": "uuid",
      "name": "Москва"
    },
    "is_active": true,
    "created_by": {
      "id": "uuid",
      "name": "Иванов Алексей"
    },
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2026-03-01T14:00:00.000Z",
    "stats": {
      "total_orders": 156,
      "total_revenue": 4500000,
      "active_contracts": 2,
      "pending_requests": 5
    },
    "permissions": {
      "can_edit": true,
      "can_delete": false
    }
  }
}
```

---

### 9.3 POST /clients — Создание клиента

**Авторизация:** Требуется JWT. Право: `clients.create`

**Request Body:**
```json
{
  "type": "legal",
  "name": "ООО НовыйКлиент",
  "inn": "7709876543",
  "kpp": "770101001",
  "ogrn": "1234567890123",
  "legal_address": "Москва, ул. Новая, д. 1",
  "postal_address": "Москва, ул. Новая, д. 1",
  "phone": "+7 999 987-65-43",
  "email": "info@newclient.ru",
  "contact_name": "Петров Алексей",
  "contact_phone": "+7 999 987-65-43",
  "contact_email": "petrov@newclient.ru",
  "client_group": "standard",
  "credit_limit": 100000,
  "payment_days": 7,
  "filial_id": "uuid"
}
```

**Валидация:**
- `inn` — уникальность, формат (10 или 12 цифр)
- `kpp` — 9 цифр (если юр. лицо)
- `email` — формат email
- `phone` — формат телефона

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "ООО НовыйКлиент",
    "inn": "7709876543",
    "is_active": true,
    "created_at": "2026-03-20T17:00:00.000Z"
  }
}
```

---

## 10. Модуль "Транспорт" (Vehicles)

### 10.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/vehicles` | Список транспорта |
| GET | `/vehicles/{id}` | Детали транспорта |
| POST | `/vehicles` | Создание |
| PUT | `/vehicles/{id}` | Обновление |
| PATCH | `/vehicles/{id}` | Частичное обновление |
| DELETE | `/vehicles/{id}` | Удаление |
| PATCH | `/vehicles/{id}/status` | Изменение статуса |
| GET | `/vehicles/{id}/trips` | Рейсы транспорта |

---

### 10.2 GET /vehicles — Список транспорта

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| filter[status] | string | available, in_trip, maintenance, broken, reserved |
| filter[body_type] | string | tent, van, flatbed, tank, refrigerator |
| filter[available_from] | datetime | Доступен с даты/времени |
| filter[min_capacity] | number | Мин. грузоподъёмность |
| available_for_request | uuid | Подобрать для заявки |

**Пример подбора транспорта:**
```
GET /vehicles?available_for_request=uuid&filter[min_capacity]=3000
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "plate_number": "А123АА 77",
      "brand": "КАМАЗ",
      "model": "5490",
      "body_type": "van",
      "body_type_display": "Фургон",
      "capacity_kg": 5000,
      "capacity_m3": 20,
      "status": "available",
      "status_display": "Доступен",
      "temperature_control": true,
      "temperature_from": 2,
      "temperature_to": 8,
      "filial": {
        "id": "uuid",
        "name": "Москва"
      }
    },
    {
      "id": "uuid",
      "plate_number": "Б456ВВ 77",
      "brand": "МАЗ",
      "body_type": "refrigerator",
      "capacity_kg": 4000,
      "status": "available",
      "temperature_control": true,
      "temperature_from": -18,
      "temperature_to": -22
    },
    {
      "id": "uuid",
      "plate_number": "В789КК 77",
      "brand": "Скания",
      "body_type": "tent",
      "capacity_kg": 20000,
      "status": "in_trip",
      "status_display": "В рейсе"
    }
  ]
}
```

---

## 11. Модуль "Водители" (Drivers)

### 11.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/drivers` | Список водителей |
| GET | `/drivers/{id}` | Детали водителя |
| POST | `/drivers` | Создание |
| PUT | `/drivers/{id}` | Обновление |
| PATCH | `/drivers/{id}` | Частичное обновление |
| DELETE | `/drivers/{id}` | Удаление |
| PATCH | `/drivers/{id}/status` | Изменение статуса |
| GET | `/drivers/{id}/trips` | Рейсы водителя |

---

### 11.2 GET /drivers — Список водителей

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| filter[status] | string | available, in_trip, vacation, sick, day_off |
| filter[license_category] | string | B, C, CE, D |
| filter[available_from] | datetime | Доступен с даты |
| available_for_request | uuid | Подобрать для заявки |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "employee_id": "DRV-001",
      "name": "Сидоров Алексей",
      "phone": "+7 999 123-45-67",
      "license_category": "CE",
      "license_expires": "2027-06-15",
      "status": "available",
      "status_display": "Доступен",
      "rating": 4.8,
      "current_trip": null,
      "filial": {
        "id": "uuid",
        "name": "Москва"
      }
    },
    {
      "id": "uuid",
      "employee_id": "DRV-002",
      "name": "Козлов Борис",
      "phone": "+7 999 234-56-78",
      "license_category": "CE",
      "status": "in_trip",
      "status_display": "В рейсе",
      "current_trip": {
        "id": "uuid",
        "number": "TRP-2026-0038",
        "ends_at": "2026-03-26T18:00:00.000Z"
      }
    }
  ]
}
```

---

## 12. Модуль "Пользователи" (Users)

### 12.1 Endpoints Overview

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/users/me` | Текущий пользователь |
| GET | `/users` | Список пользователей (ADMIN) |
| GET | `/users/{id}` | Детали пользователя (ADMIN) |
| POST | `/users` | Создание пользователя (ADMIN) |
| PUT | `/users/{id}` | Обновление (ADMIN) |
| PATCH | `/users/{id}` | Частичное обновление (ADMIN) |
| DELETE | `/users/{id}` | Удаление (ADMIN) |
| POST | `/users/{id}/reset-password` | Сброс пароля (ADMIN) |
| PATCH | `/users/{id}/status` | Блокировка/разблокировка (ADMIN) |

---

### 12.2 GET /users/me — Текущий пользователь

**Авторизация:** Требуется JWT

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "petrov@company.ru",
    "first_name": "Иван",
    "last_name": "Петров",
    "middle_name": "Сергеевич",
    "phone": "+7 999 123-45-67",
    "avatar_url": "https://storage.crm/avatars/uuid.jpg",
    "roles": [
      {
        "id": "uuid",
        "code": "DISPATCHER",
        "name": "Диспетчер"
      }
    ],
    "filial": {
      "id": "uuid",
      "name": "Москва"
    },
    "scope": "FILIAL",
    "permissions": [
      "requests.create",
      "requests.read",
      "requests.update",
      "requests.status.change",
      "trips.create",
      "trips.read",
      "trips.update"
    ],
    "is_active": true,
    "last_login_at": "2026-03-20T08:00:00.000Z"
  }
}
```

---

## 13. Комментарии и история

### 13.1 Комментарии — Общий формат

| Элемент | Описание |
|---------|----------|
| Entity | Любой объект системы с поддержкой комментариев |
| Endpoint | `/{entity}/{id}/comments` |

**Поддерживаемые сущности:**
- requests
- orders
- trips

### 13.2 GET /requests/{id}/comments — Список комментариев

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| page | integer | Пагинация |
| per_page | integer | Лимит (default: 50) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "text": "Клиент подтвердил заявку по телефону",
      "author": {
        "id": "uuid",
        "name": "Иванов Алексей",
        "avatar_url": null
      },
      "is_system": false,
      "attachments": [
        {
          "id": "uuid",
          "file_name": "screenshot.png",
          "file_url": "https://storage.crm/files/uuid.png"
        }
      ],
      "created_at": "2026-03-20T14:30:00.000Z",
      "updated_at": "2026-03-20T14:30:00.000Z"
    }
  ],
  "meta": {
    "total": 12
  }
}
```

### 13.3 POST /requests/{id}/comments — Добавление комментария

**Авторизация:** Требуется JWT. Право: `requests.update`

**Request Body:**
```json
{
  "text": "Клиент уточнил адрес выгрузки",
  "attachments": ["uuid-file-1", "uuid-file-2"]
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "text": "Клиент уточнил адрес выгрузки",
    "author": {
      "id": "uuid",
      "name": "Иванов Алексей"
    },
    "is_system": false,
    "attachments": [],
    "created_at": "2026-03-20T15:00:00.000Z"
  }
}
```

---

## 14. Уведомления

### 14.1 Endpoints

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/notifications` | Список уведомлений |
| GET | `/notifications/{id}` | Детали уведомления |
| PATCH | `/notifications/{id}` | Отметить прочитанным |
| POST | `/notifications/mark-all-read` | Отметить все прочитанными |
| GET | `/notifications/settings` | Настройки уведомлений |
| PUT | `/notifications/settings` | Обновление настроек |

---

### 14.2 GET /notifications — Список уведомлений

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|---------|
| is_read | boolean | Фильтр по статусу |
| type | string | Тип уведомления |
| limit | integer | Лимит (default: 20, max: 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "TRIP_STATUS",
      "title": "Рейс в пути",
      "body": "Рейс TRP-2026-0038 выехал из Москвы",
      "entity_type": "trip",
      "entity_id": "uuid",
      "link": "/trips/uuid",
      "is_read": false,
      "read_at": null,
      "channel": "system",
      "created_at": "2026-03-20T15:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "REQUEST_OVERDUE",
      "title": "Просрочена задача",
      "body": "Подготовка документов для REQ-2026-0038",
      "entity_type": "request",
      "entity_id": "uuid",
      "link": "/requests/uuid",
      "is_read": true,
      "read_at": "2026-03-20T14:00:00.000Z",
      "created_at": "2026-03-19T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 156,
    "unread_count": 3
  }
}
```

---

### 14.3 Типы уведомлений

| Тип | Описание | Каналы |
|-----|----------|--------|
| REQUEST_CREATED | Новая заявка | system, email |
| REQUEST_STATUS | Изменение статуса заявки | system, email |
| TRIP_CREATED | Создан рейс | system, email, push |
| TRIP_STATUS | Изменение статуса рейса | system, push |
| TRIP_DELAYED | Задержка рейса | system, email, push |
| TASK_OVERDUE | Просроченная задача | system, email |
| ORDER_CREATED | Новый заказ | system, email |
| PAYMENT_RECEIVED | Получена оплата | system, email |

---

## 15. Файлы и вложения

### 15.1 Endpoints

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/files/{id}` | Информация о файле |
| GET | `/files/{id}/download` | Скачивание файла |
| POST | `/{entity}/{id}/files` | Загрузка файла |
| DELETE | `/files/{id}` | Удаление файла |

---

### 15.2 POST /requests/{id}/files — Загрузка файла

**Авторизация:** Требуется JWT. Право: `requests.update`

**Content-Type:** `multipart/form-data`

**Request:**

| Параметр | Тип | Обязательность | Описание |
|----------|-----|----------------|----------|
| file | binary | Да | Файл (max: 10MB) |
| description | string | Нет | Описание файла |

**Allowed file types:**
```
Images: jpg, jpeg, png, gif, webp (max 5MB)
Documents: pdf, doc, docx, xls, xlsx (max 10MB)
Archives: zip (max 20MB)
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "file_name": "document.pdf",
    "original_name": "Счёт.pdf",
    "mime_type": "application/pdf",
    "size": 1024000,
    "size_formatted": "1.0 MB",
    "url": "https://storage.crm/files/uuid.pdf",
    "description": "Счёт на оплату",
    "uploaded_by": {
      "id": "uuid",
      "name": "Иванов Алексей"
    },
    "created_at": "2026-03-20T15:00:00.000Z"
  }
}
```

---

## 16. Отчёты

### 16.1 Endpoints

| Метод | Endpoint | Описание |
|-------|---------|---------|
| GET | `/reports` | Список доступных отчётов |
| GET | `/reports/{id}` | Метаданные отчёта |
| POST | `/reports/{id}/generate` | Генерация отчёта |
| GET | `/reports/{id}/download/{file_id}` | Скачивание результата |

---

### 16.2 POST /reports/{id}/generate — Генерация отчёта

**Авторизация:** Требуется JWT. Право: `reports.view`

**Request Body:**
```json
{
  "parameters": {
    "date_from": "2026-03-01",
    "date_to": "2026-03-31",
    "client_id": "uuid",
    "filial_id": "uuid",
    "format": "xlsx"
  }
}
```

**Параметры отчёта (по типам):**

| Отчёт | Параметры |
|-------|----------|
| trips_completed | date_from, date_to, driver_id, vehicle_id, client_id |
| requests_by_status | date_from, date_to, client_id |
| fleet_utilization | date_from, date_to, vehicle_id |
| revenue_by_client | date_from, date_to |
| driver_performance | date_from, date_to, driver_id |

**Response 202 (Async):**
```json
{
  "data": {
    "report_id": "uuid",
    "status": "processing",
    "estimated_time_seconds": 60,
    "check_status_url": "/reports/{id}/status/uuid"
  }
}
```

**Response 200 (Sync):**
```json
{
  "data": {
    "report_id": "uuid",
    "status": "completed",
    "file": {
      "id": "uuid",
      "file_name": "report_2026_03.xlsx",
      "url": "https://storage.crm/reports/uuid.xlsx",
      "size": 1024000
    }
  }
}
```

---

## Приложения

### A. Типы данных

| Тип | Формат | Пример |
|-----|--------|--------|
| UUID | v4 | `550e8400-e29b-41d4-a716-446655440000` |
| Date | YYYY-MM-DD | `2026-03-20` |
| DateTime | ISO 8601 | `2026-03-20T14:30:00.000Z` |
| Decimal | String | `"1234.56"` |
| Money | Decimal (2) | `"45000.00"` |
| Boolean | JSON boolean | `true` |
| Enum | String | `"new"`, `"urgent"` |

### B. Зарезервированные заголовки

| Заголовок | Описание |
|-----------|---------|
| Authorization | Bearer token |
| Content-Type | application/json |
| Accept | application/json |
| X-Request-ID | Request tracking ID |
| X-Idempotency-Key | Для POST запросов |
| X-Timezone | Client timezone |
| X-Per-Page | Override default pagination |

### C. Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Все API | 1000 | 15 минут |
| /auth/* | 5 | 1 минута |
| /reports/* | 10 | 1 минута |
| /files/upload | 50 | 1 минута |

---

**Документ подготовлен для:**
- [ ] Review Frontend Team
- [ ] Review Backend Team
- [ ] Согласование с Product Owner
- [ ] QA Team

**История версий:**

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 0.1 | 20.03.2026 | Backend Architecture Team | Initial draft |
