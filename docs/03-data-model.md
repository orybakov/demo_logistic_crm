# Data Model Specification
## Логистическая CRM

**Версия:** 1.0  
**Статус:** Draft  
**Дата:** 20.03.2026  
**Документ:** DMS-001

---

## Содержание

1. [Введение](#1-введение)
2. [Концептуальная модель](#2-концептуальная-модель)
3. [Логическая модель](#3-логическая-модель)
   - [3.1 Сущности ядра](#31-сущности-ядра)
   - [3.2 Справочники](#32-справочники)
   - [3.3 Операционные данные](#33-операционные-данные)
   - [3.4 Безопасность и доступ](#34-безопасность-и-доступ)
   - [3.5 Уведомления и события](#35-уведомления-события)
4. [Справочники и перечисления](#4-справочники-и-перечисления)
5. [Аудит изменений](#5-аудит-изменений)
6. [Историчность данных](#6-историчность-данных)
7. [Список таблиц MVP](#7-список-таблиц-mvp)

---

## 1. Введение

### 1.1 Назначение документа

Данный документ содержит полную спецификацию модели данных для логистической CRM-системы. Определяет структуру базы данных, включая сущности, атрибуты, связи, ограничения и правила целостности.

### 1.2 Принципы моделирования

| Принцип | Описание |
|---------|----------|
| **Нормализация** | Минимум 3NF для оперативных данных |
| **Денормализация** | Допускается для аналитических данных и кэширования |
| **Историчность** | Изменения статусов и ключевых полей сохраняются с датой |
| **Мягкое удаление** | Все сущности имеют флаг `is_deleted` |
| **Аудит** | Все изменения логируются с пользователем и датой |

### 1.3 Нотация

```
[PK]  — Первичный ключ
[FK]  — Внешний ключ
[UK]  — Уникальный ключ
[NN]  — Not Null (обязательное)
[OD]  — Опциональное (optional, default)
[AUD] — Аудируемое поле
[HST] — Историзируемое поле
```

### 1.4 Типы данных

| Тип | Обозначение | Описание | Пример |
|-----|-------------|----------|--------|
| UUID | `uuid` | Идентификатор | `550e8400-e29b-41d4-a716-446655440000` |
| Строка | `varchar(n)` | Строка до n символов | `name VARCHAR(200)` |
| Текст | `text` | Неограниченный текст | `description TEXT` |
| Целое | `int` | Целое число | `age INT` |
| Большое целое | `bigint` | Большое целое | `amount BIGINT` |
| Десятичное | `decimal(p,s)` | Точное число | `price DECIMAL(10,2)` |
| Дата | `date` | Дата | `2026-03-20` |
| Время | `time` | Время | `14:30:00` |
| Дата-время | `datetime` | Timestamp | `2026-03-20 14:30:00` |
| Boolean | `boolean` | Да/Нет | `true/false` |
| JSON | `jsonb` | JSON-объект | `{"key": "value"}` |
| Enum | `enum` | Перечисление | `status: 'new', 'active'` |

---

## 2. Концептуальная модель

### 2.1 ER-диаграмма (сущности и связи)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              КОНЦЕПТУАЛЬНАЯ МОДЕЛЬ                             │
│                              LOGISTICS CRM CORE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │    FILIAL       │
                                    │    (Филиал)     │
                                    └────────┬────────┘
                                             │ 1:N
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    │
┌───────────────────┐              ┌───────────────────┐                            │
│     CLIENT        │              │      USER         │                            │
│     (Клиент)      │ 1:N         │   (Пользователь)   │                            │
└─────────┬─────────┘              └─────────┬─────────┘                            │
          │                                    │                                    │
          │ 1:N                                 │ 1:N                                 │
          ▼                                    ▼                                    │
┌───────────────────┐              ┌───────────────────┐                            │
│    CONTRACT       │              │    ROLE_USER      │                            │
│    (Договор)      │              │   (Роль/Доступ)   │                            │
└─────────┬─────────┘              └─────────┬─────────┘                            │
          │                                    │                                    │
          │ 1:N                                 │ N:1                                 │
          │                                    ▼                                    │
          ▼                          ┌───────────────────┐                            │
┌───────────────────┐                │       ROLE       │                            │
│      ORDER        │                │      (Роль)       │                            │
│     (Заказ)       │                └───────────────────┘                            │
└─────────┬─────────┘                                                              │
          │                                                                        │
          │ 1:1                                                                       │
          ▼                                                                        │
┌───────────────────┐     1:N     ┌───────────────────┐                            │
│     REQUEST      │◀──────────▶│      POINT        │                            │
│     (Заявка)      │            │    (Точка)        │                            │
└─────────┬─────────┘            └───────────────────┘                            │
          │                                                                        │
          │ 1:N                                                                       │
          ▼                                                                        │
┌───────────────────┐                                                               │
│      TRIP         │                                                               │
│     (Рейс)        │                                                               │
└─────────┬─────────┘                                                               │
          │                                                                        │
          ├───────────────────────────────┬───────────────────────────────────────┐ │
          │                               │                                       │ │
          ▼                               ▼                                       ▼ │
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐          │
│     VEHICLE       │     │     DRIVER        │     │    CHECKPOINT     │          │
│    (Транспорт)    │     │    (Водитель)     │     │ (Контр.точка)    │          │
└───────────────────┘     └───────────────────┘     └───────────────────┘          │
                                                                                   │
┌───────────────────────────────────────────────────────────────────────────────┐ │
│                              СПРАВОЧНИКИ                                        │ │
├───────────┬───────────┬───────────┬───────────┬───────────┬────────────┬────────┤ │
│ CARGO_TYPE│ ROUTE_Tmpl│  TARIFF   │  TARIFF_RULE│ LOCATION │ REGION     │  ...  │ │
│ Типы груза│ Шаблоны   │  Тарифы   │  Правила    │ Точки    │ Регионы   │        │ │
│           │ маршрутов │           │  тарификации│           │            │        │ │
└───────────┴───────────┴───────────┴───────────┴───────────┴────────────┴────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                              АУДИТ И СОБЫТИЯ                                   │
├───────────────────┬───────────────────┬───────────────────┬────────────────────┤
│    AUDIT_LOG      │   NOTIFICATION    │   EVENT           │   USER_SESSION    │
│   (Журнал)        │  (Уведомления)     │   (События)       │   (Сессии)        │
└───────────────────┴───────────────────┴───────────────────┴────────────────────┘
```

### 2.2 Описание связей

| Связь | Тип | Родительская | Дочерняя | Описание |
|-------|-----|--------------|----------|----------|
| R01 | 1:N | FILIAL | USER | Пользователь принадлежит филиалу |
| R02 | 1:N | FILIAL | CLIENT | Клиент принадлежит филиалу |
| R03 | 1:N | FILIAL | VEHICLE | Транспорт принадлежит филиалу |
| R04 | 1:N | FILIAL | DRIVER | Водитель принадлежит филиалу |
| R05 | 1:N | CLIENT | CONTRACT | У клиента может быть несколько договоров |
| R06 | 1:N | CLIENT | ORDER | Клиент создаёт заказы |
| R07 | 1:N | CLIENT | REQUEST | Клиент создаёт заявки |
| R08 | 1:N | CONTRACT | ORDER | Заказ привязан к договору |
| R09 | 1:1 | ORDER | REQUEST | Заказ генерирует заявку (опционально) |
| R10 | 1:N | REQUEST | POINT | Заявка содержит точки маршрута |
| R11 | 1:N | REQUEST | TRIP | Заявка порождает рейсы |
| R12 | 1:N | REQUEST | CARGO_ITEM | Заявка содержит товары |
| R13 | 1:N | TRIP | CHECKPOINT | Рейс проходит через точки контроля |
| R14 | N:1 | TRIP | VEHICLE | Рейс выполняется транспортом |
| R15 | N:1 | TRIP | DRIVER | Рейс выполняется водителем |
| R16 | 1:N | USER | REQUEST | Заявка имеет ответственного |
| R17 | N:M | USER | ROLE | Пользователь имеет роли |
| R18 | 1:N | USER | NOTIFICATION | Уведомления принадлежат пользователю |
| R19 | 1:N | USER | AUDIT_LOG | Логи принадлежат пользователю |

---

## 3. Логическая модель

### 3.1 Сущности ядра

#### 3.1.1 FILIAL — Филиал

**Описание:** Организационная единица компании. Может быть головным офисом или региональным подразделением.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование филиала |
| short_name | varchar(50) | [OD] | Краткое наименование |
| code | varchar(20) | [UK][NN] | Внутренний код (MOS, SPB, KRD) |
| address | text | [OD] | Юридический адрес |
| phone | varchar(50) | [OD] | Телефон |
| email | varchar(200) | [OD] | Email |
| is_head | boolean | [NN][DEFAULT false] | Является головным |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

---

#### 3.1.2 USER — Пользователь

**Описание:** Сотрудник компании с доступом к системе.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| email | varchar(200) | [UK][NN] | Email (логин) |
| password_hash | varchar(255) | [NN] | Хеш пароля |
| first_name | varchar(100) | [NN] | Имя |
| last_name | varchar(100) | [NN] | Фамилия |
| middle_name | varchar(100) | [OD] | Отчество |
| phone | varchar(50) | [OD] | Телефон |
| avatar_url | varchar(500) | [OD] | URL аватара |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| is_superadmin | boolean | [NN][DEFAULT false] | Супер-администратор |
| last_login_at | datetime | [OD] | Последний вход |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- FILIAL (FK): `filial_id → FILIAL.id`
- ROLE (M:N через USER_ROLE)

---

#### 3.1.3 CLIENT — Клиент

**Описание:** Юридическое или физическое лицо, являющееся контрагентом компании.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| type | enum('legal', 'individual') | [NN] | Тип клиента |
| name | varchar(200) | [NN] | Наименование / ФИО |
| inn | varchar(12) | [UK][NN] | ИНН |
| kpp | varchar(9) | [OD] | КПП |
| ogrn | varchar(15) | [OD] | ОГРН |
| legal_address | text | [OD] | Юридический адрес |
| postal_address | text | [OD] | Почтовый адрес |
| phone | varchar(50) | [OD] | Телефон |
| email | varchar(200) | [OD] | Email |
| website | varchar(200) | [OD] | Сайт |
| contact_name | varchar(200) | [OD] | Контактное лицо |
| contact_phone | varchar(50) | [OD] | Телефон контакта |
| contact_email | varchar(200) | [OD] | Email контакта |
| client_group | enum('vip', 'standard', 'problem') | [OD] | Группа |
| credit_limit | decimal(15,2) | [OD][DEFAULT 0] | Кредитный лимит |
| payment_days | int | [OD][DEFAULT 0] | Дней на оплату |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_by | uuid | [FK][NN] | Создал |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- FILIAL (FK): `filial_id → FILIAL.id`
- USER (FK): `created_by → USER.id`

---

#### 3.1.4 CONTRACT — Договор

**Описание:** Договор с клиентом, определяющий условия сотрудничества и тарифы.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| number | varchar(50) | [UK][NN] | Номер договора |
| client_id | uuid | [FK][NN] | Ссылка на клиента |
| type | enum('one_time', 'framework', 'annual') | [NN] | Тип договора |
| date_from | date | [NN] | Дата начала |
| date_to | date | [NN] | Дата окончания |
| payment_type | enum('prepayment', 'postpay_7', 'postpay_14', 'postpay_30') | [NN] | Тип оплаты |
| credit_limit | decimal(15,2) | [OD][DEFAULT 0] | Кредитный лимит |
| discount_percent | decimal(5,2) | [OD][DEFAULT 0] | Процент скидки |
| status | enum('active', 'expired', 'terminated') | [NN][DEFAULT 'active'] | Статус |
| terms | text | [OD] | Условия договора |
| document_url | varchar(500) | [OD] | URL скан-копии |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| created_by | uuid | [FK][NN] | Создал |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- CLIENT (FK): `client_id → CLIENT.id`
- FILIAL (FK): `filial_id → FILIAL.id`
- USER (FK): `created_by → USER.id`

---

#### 3.1.5 ORDER — Заказ

**Описание:** Коммерческий заказ на оказание логистических услуг.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| number | varchar(50) | [UK][NN] | Номер заказа (ORD-YYYY-NNNN) |
| client_id | uuid | [FK][NN] | Ссылка на клиента |
| contract_id | uuid | [FK][OD] | Ссылка на договор |
| request_id | uuid | [FK][OD] | Ссылка на заявку (1:1) |
| order_date | date | [NN] | Дата заказа |
| subtotal | decimal(15,2) | [NN][DEFAULT 0] | Сумма без НДС |
| vat_rate | decimal(5,2) | [NN][DEFAULT 20] | Ставка НДС % |
| vat_amount | decimal(15,2) | [NN][DEFAULT 0] | Сумма НДС |
| total | decimal(15,2) | [NN][DEFAULT 0] | Итого |
| paid_amount | decimal(15,2) | [NN][DEFAULT 0] | Оплачено |
| payment_status | enum('not_paid', 'partially_paid', 'paid', 'overpaid') | [NN][DEFAULT 'not_paid'] | Статус оплаты |
| status | enum('draft', 'sent', 'approved', 'paid', 'partially_executed', 'executed', 'archived') | [NN][DEFAULT 'draft'] | Статус |
| payment_deadline | date | [OD] | Срок оплаты |
| notes | text | [OD] | Примечания |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| created_by | uuid | [FK][NN] | Создал |
| assigned_to | uuid | [FK][OD] | Ответственный |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- CLIENT (FK): `client_id → CLIENT.id`
- CONTRACT (FK): `contract_id → CONTRACT.id`
- REQUEST (FK): `request_id → REQUEST.id`
- USER (FK): `created_by → USER.id`
- USER (FK): `assigned_to → USER.id`
- FILIAL (FK): `filial_id → FILIAL.id`

**История статусов:** ORDER_STATUS_HISTORY

---

#### 3.1.6 REQUEST — Заявка

**Описание:** Заявка на перевозку груза. Центральная сущность системы.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| number | varchar(50) | [UK][NN] | Номер заявки (REQ-YYYY-NNNN) |
| client_id | uuid | [FK][NN] | Ссылка на клиента |
| order_id | uuid | [FK][OD] | Ссылка на заказ |
| type | enum('auto', 'railway', 'multimodal') | [NN][DEFAULT 'auto'] | Тип перевозки |
| cargo_type_id | uuid | [FK][OD] | Ссылка на тип груза |
| total_weight | decimal(10,3) | [OD] | Общий вес (кг) |
| total_volume | decimal(10,3) | [OD] | Общий объём (м³) |
| total_pieces | int | [OD] | Количество мест |
| status | enum('new', 'calculating', 'offered', 'confirmed', 'in_progress', 'completed', 'cancelled') | [NN][DEFAULT 'new'] | Статус |
| priority | enum('normal', 'urgent', 'express') | [NN][DEFAULT 'normal'] | Приоритет |
| flags | jsonb | [OD] | Флаги (URGENT, FRAGILE, TEMP...) |
| temperature_from | decimal(5,2) | [OD] | Температура от (°C) |
| temperature_to | decimal(5,2) | [OD] | Температура до (°C) |
| notes | text | [OD] | Примечания |
| estimated_price | decimal(15,2) | [OD] | Расчётная стоимость |
| calculated_at | datetime | [OD] | Дата расчёта |
| confirmed_at | datetime | [OD] | Дата подтверждения |
| completed_at | datetime | [OD] | Дата завершения |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| created_by | uuid | [FK][NN] | Создал |
| assigned_to | uuid | [FK][OD] | Ответственный |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Поле `flags` (JSONB):**
```json
{
  "urgent": true,
  "fragile": false,
  "oversize": true,
  "temp_controlled": true,
  "hazmat": false,
  "express": false
}
```

**Связи:**
- CLIENT (FK): `client_id → CLIENT.id`
- ORDER (FK): `order_id → ORDER.id`
- CARGO_TYPE (FK): `cargo_type_id → CARGO_TYPE.id`
- USER (FK): `created_by → USER.id`
- USER (FK): `assigned_to → USER.id`
- FILIAL (FK): `filial_id → FILIAL.id`
- POINT (1:N)
- CARGO_ITEM (1:N)
- TRIP (1:N)

**История статусов:** REQUEST_STATUS_HISTORY

---

#### 3.1.7 POINT — Точка маршрута

**Описание:** Точка загрузки или выгрузки в заявке.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| request_id | uuid | [FK][NN] | Ссылка на заявку |
| point_type | enum('loading', 'unloading', 'transit') | [NN] | Тип точки |
| sequence | int | [NN] | Порядок в маршруте |
| location_id | uuid | [FK][OD] | Ссылка на справочник точек |
| address | varchar(500) | [NN] | Адрес |
| city | varchar(200) | [OD] | Город |
| region | varchar(200) | [OD] | Регион |
| postal_code | varchar(20) | [OD] | Почтовый индекс |
| latitude | decimal(10,7) | [OD] | Широта |
| longitude | decimal(10,7) | [OD] | Долгота |
| contact_name | varchar(200) | [OD] | Контактное лицо |
| contact_phone | varchar(50) | [OD] | Телефон контакта |
| planned_date | date | [OD] | Плановая дата |
| planned_time_from | time | [OD] | Плановое время с |
| planned_time_to | time | [OD] | Плановое время по |
| actual_arrival | datetime | [OD] | Фактическое прибытие |
| actual_departure | datetime | [OD] | Фактический убытие |
| instructions | text | [OD] | Инструкции для водителя |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- REQUEST (FK): `request_id → REQUEST.id`
- LOCATION (FK): `location_id → LOCATION.id`

---

#### 3.1.8 CARGO_ITEM — Позиция груза

**Описание:** Отдельный item груза в заявке.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| request_id | uuid | [FK][NN] | Ссылка на заявку |
| description | varchar(500) | [OD] | Описание товара |
| weight | decimal(10,3) | [OD] | Вес (кг) |
| volume | decimal(10,3) | [OD] | Объём (м³) |
| length | decimal(10,3) | [OD] | Длина (м) |
| width | decimal(10,3) | [OD] | Ширина (м) |
| height | decimal(10,3) | [OD] | Высота (м) |
| pieces | int | [OD] | Количество мест |
| package_type | enum('pallet', 'box', 'barrel', 'container', 'bulk', 'other') | [OD] | Тип упаковки |
| is_dangerous | boolean | [OD][DEFAULT false] | Опасный груз |
| adr_class | varchar(10) | [OD] | Класс ADR |
| is_fragile | boolean | [OD][DEFAULT false] | Хрупкий |
| temperature_required | boolean | [OD][DEFAULT false] | Требуется температура |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- REQUEST (FK): `request_id → REQUEST.id`

---

#### 3.1.9 VEHICLE — Транспортное средство

**Описание:** Автомобиль или другой транспорт компании.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| plate_number | varchar(20) | [UK][NN] | Государственный номер |
| brand | varchar(100) | [NN] | Марка |
| model | varchar(100) | [OD] | Модель |
| year | int | [OD] | Год выпуска |
| body_type | enum('tent', 'van', 'flatbed', 'tank', 'refrigerator', 'container') | [NN] | Тип кузова |
| capacity_kg | decimal(10,2) | [NN] | Грузоподъёмность (кг) |
| capacity_m3 | decimal(10,2) | [OD] | Объём (м³) |
| length_m | decimal(6,2) | [OD] | Длина (м) |
| width_m | decimal(6,2) | [OD] | Ширина (м) |
| height_m | decimal(6,2) | [OD] | Высота (м) |
| fuel_type | enum('diesel', 'gasoline', 'gas', 'electric') | [OD] | Тип топлива |
| vin | varchar(17) | [UK][OD] | VIN-номер |
| trailer_number | varchar(20) | [OD] | Номер прицепа |
| temperature_control | boolean | [OD][DEFAULT false] | Температурный контроль |
| temperature_from | decimal(5,2) | [OD] | Температура от |
| temperature_to | decimal(5,2) | [OD] | Температура до |
| status | enum('available', 'in_trip', 'maintenance', 'broken', 'reserved') | [NN][DEFAULT 'available'] | Статус |
| mileage | decimal(10,1) | [OD] | Пробег (км) |
| next_maintenance | date | [OD] | Дата след. ТО |
| insurance_number | varchar(50) | [OD] | Номер страховки |
| insurance_expires | date | [OD] | Срок страховки |
| foto_url | varchar(500) | [OD] | URL фото |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- FILIAL (FK): `filial_id → FILIAL.id`

---

#### 3.1.10 DRIVER — Водитель

**Описание:** Водитель транспортного средства.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| employee_id | varchar(50) | [UK][NN] | Табельный номер |
| first_name | varchar(100) | [NN] | Имя |
| last_name | varchar(100) | [NN] | Фамилия |
| middle_name | varchar(100) | [OD] | Отчество |
| birth_date | date | [OD] | Дата рождения |
| phone | varchar(50) | [NN] | Телефон |
| email | varchar(200) | [OD] | Email |
| photo_url | varchar(500) | [OD] | URL фото |
| license_number | varchar(50) | [UK][NN] | Номер удостоверения |
| license_category | varchar(10) | [NN] | Категория прав (B, C, CE, D) |
| license_expires | date | [NN] | Срок прав |
| medical_card_number | varchar(50) | [OD] | Номер мед. справки |
| medical_card_expires | date | [OD] | Срок мед. справки |
| status | enum('available', 'in_trip', 'vacation', 'sick', 'day_off') | [NN][DEFAULT 'available'] | Статус |
| rating | decimal(3,2) | [OD] | Рейтинг (1-5) |
| notes | text | [OD] | Примечания |
| filial_id | uuid | [FK][NN] | Ссылка на филиал |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- FILIAL (FK): `filial_id → FILIAL.id`

---

#### 3.1.11 TRIP — Рейс

**Описание:** Конкретная перевозка с назначенными водителем и транспортом.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| number | varchar(50) | [UK][NN] | Номер рейса (TRP-YYYY-NNNN) |
| request_id | uuid | [FK][NN] | Ссылка на заявку |
| vehicle_id | uuid | [FK][NN] | Ссылка на транспорт |
| driver_id | uuid | [FK][NN] | Ссылка на водителя |
| status | enum('scheduled', 'departed', 'in_transit', 'loading', 'unloading', 'problem', 'completed', 'cancelled') | [NN][DEFAULT 'scheduled'] | Статус |
| planned_start | datetime | [OD] | Плановое начало |
| actual_start | datetime | [OD] | Фактическое начало |
| planned_end | datetime | [OD] | Плановое окончание |
| actual_end | datetime | [OD] | Фактическое окончание |
| planned_distance | decimal(10,2) | [OD] | Плановое расстояние (км) |
| actual_distance | decimal(10,2) | [OD] | Фактическое расстояние (км) |
| planned_duration | int | [OD] | Плановое время (мин) |
| actual_duration | int | [OD] | Фактическое время (мин) |
| planned_fuel | decimal(8,2) | [OD] | Плановый расход (л) |
| actual_fuel | decimal(8,2) | [OD] | Фактический расход (л) |
| delay_minutes | int | [OD] | Опоздание (мин) |
| delay_reason | text | [OD] | Причина опоздания |
| cancellation_reason | text | [OD] | Причина отмены |
| notes | text | [OD] | Примечания |
| assigned_by | uuid | [FK][OD] | Кто назначил |
| completed_by | uuid | [FK][OD] | Кто закрыл |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

**Связи:**
- REQUEST (FK): `request_id → REQUEST.id`
- VEHICLE (FK): `vehicle_id → VEHICLE.id`
- DRIVER (FK): `driver_id → DRIVER.id`
- USER (FK): `assigned_by → USER.id`
- USER (FK): `completed_by → USER.id`
- CHECKPOINT (1:N)

**История статусов:** TRIP_STATUS_HISTORY

---

#### 3.1.12 CHECKPOINT — Контрольная точка

**Описание:** Контрольная точка рейса для отслеживания прогресса.

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| trip_id | uuid | [FK][NN] | Ссылка на рейс |
| point_id | uuid | [FK][OD] | Ссылка на точку заявки |
| checkpoint_type | enum('departure', 'transit', 'arrival', 'fuel', 'custom') | [NN] | Тип точки |
| sequence | int | [NN] | Порядок |
| name | varchar(200) | [NN] | Название |
| address | varchar(500) | [OD] | Адрес |
| latitude | decimal(10,7) | [OD] | Широта |
| longitude | decimal(10,7) | [OD] | Долгота |
| planned_time | datetime | [OD] | Плановое время |
| actual_time | datetime | [OD] | Фактическое время |
| is_completed | boolean | [NN][DEFAULT false] | Выполнена |
| completed_at | datetime | [OD] | Время выполнения |
| completed_by | uuid | [FK][OD] | Кто выполнил |
| notes | text | [OD] | Примечания |
| photo_url | varchar(500) | [OD] | URL фото |
| signature_url | varchar(500) | [OD] | URL подписи |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- TRIP (FK): `trip_id → TRIP.id`
- POINT (FK): `point_id → POINT.id`
- USER (FK): `completed_by → USER.id`

---

### 3.2 Справочники

#### 3.2.1 LOCATION — Справочник местоположений

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование |
| type | enum('warehouse', 'terminal', 'factory', 'store', 'port', 'railway_station', 'other') | [NN] | Тип |
| address | text | [NN] | Адрес |
| city | varchar(200) | [NN] | Город |
| region_id | uuid | [FK][OD] | Ссылка на регион |
| postal_code | varchar(20) | [OD] | Почтовый индекс |
| latitude | decimal(10,7) | [OD] | Широта |
| longitude | decimal(10,7) | [OD] | Долгота |
| contact_name | varchar(200) | [OD] | Контактное лицо |
| contact_phone | varchar(50) | [OD] | Телефон |
| opening_hours | varchar(200) | [OD] | Часы работы |
| notes | text | [OD] | Примечания |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |
| deleted_at | datetime | [OD] | Дата удаления |
| is_deleted | boolean | [NN][DEFAULT false] | Флаг удаления |

---

#### 3.2.2 REGION — Регион

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование |
| code | varchar(20) | [UK][NN] | Код (например, MOS, SPB) |
| country | varchar(100) | [NN][DEFAULT 'Россия'] | Страна |
| timezone | varchar(50) | [OD] | Часовой пояс |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

---

#### 3.2.3 CARGO_TYPE — Тип груза

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование |
| code | varchar(20) | [UK][NN] | Код |
| description | text | [OD] | Описание |
| requires_temperature | boolean | [NN][DEFAULT false] | Требует температуры |
| is_hazardous | boolean | [NN][DEFAULT false] | Опасный |
| adr_classes | jsonb | [OD] | Допустимые классы ADR |
| default_package | enum | [OD] | Тип упаковки по умолчанию |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

---

#### 3.2.4 ROUTE_TEMPLATE — Шаблон маршрута

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование |
| from_location_id | uuid | [FK][NN] | Откуда |
| to_location_id | uuid | [FK][NN] | Куда |
| distance_km | decimal(10,2) | [NN] | Расстояние (км) |
| duration_minutes | int | [NN] | Время в пути (мин) |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- LOCATION (FK): `from_location_id → LOCATION.id`
- LOCATION (FK): `to_location_id → LOCATION.id`

---

#### 3.2.5 TARIFF — Тариф

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| name | varchar(200) | [NN] | Наименование |
| route_template_id | uuid | [FK][OD] | Шаблон маршрута |
| vehicle_type | enum('tent', 'van', 'flatbed', 'tank', 'refrigerator', 'container') | [NN] | Тип транспорта |
| price_per_km | decimal(10,2) | [OD] | Цена за км |
| price_per_ton | decimal(10,2) | [OD] | Цена за тонну |
| price_per_m3 | decimal(10,2) | [OD] | Цена за м³ |
| minimum_price | decimal(10,2) | [OD] | Минимальная стоимость |
| fuel_surcharge_percent | decimal(5,2) | [OD] | Топливная надбавка % |
| client_id | uuid | [FK][OD] | Индивидуальный тариф (клиент) |
| contract_id | uuid | [FK][OD] | Индивидуальный тариф (договор) |
| date_from | date | [NN] | Действует с |
| date_to | date | [OD] | Действует по |
| is_active | boolean | [NN][DEFAULT true] | Активен |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

---

### 3.3 Операционные данные

#### 3.3.1 ORDER_ITEM — Позиция заказа

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| order_id | uuid | [FK][NN] | Ссылка на заказ |
| description | varchar(500) | [NN] | Описание услуги |
| quantity | decimal(10,3) | [NN][DEFAULT 1] | Количество |
| unit | varchar(20) | [NN][DEFAULT 'услуга'] | Единица измерения |
| price_per_unit | decimal(15,2) | [NN] | Цена за единицу |
| total | decimal(15,2) | [NN] | Сумма |
| vat_rate | decimal(5,2) | [OD] | Ставка НДС % |
| notes | text | [OD] | Примечания |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- ORDER (FK): `order_id → ORDER.id`

---

#### 3.3.2 PAYMENT — Платёж

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| order_id | uuid | [FK][NN] | Ссылка на заказ |
| amount | decimal(15,2) | [NN] | Сумма платежа |
| payment_date | date | [NN] | Дата платежа |
| payment_method | enum('cash', 'bank_transfer', 'card', 'other') | [NN] | Метод оплаты |
| document_number | varchar(50) | [OD] | Номер документа |
| document_url | varchar(500) | [OD] | URL документа |
| status | enum('pending', 'confirmed', 'rejected') | [NN][DEFAULT 'pending'] | Статус |
| confirmed_by | uuid | [FK][OD] | Кто подтвердил |
| confirmed_at | datetime | [OD] | Дата подтверждения |
| notes | text | [OD] | Примечания |
| created_by | uuid | [FK][NN] | Создал |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- ORDER (FK): `order_id → ORDER.id`
- USER (FK): `created_by → USER.id`
- USER (FK): `confirmed_by → USER.id`

---

### 3.4 Безопасность и доступ

#### 3.4.1 ROLE — Роль

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| code | varchar(50) | [UK][NN] | Код роли |
| name | varchar(200) | [NN] | Наименование |
| description | text | [OD] | Описание |
| is_system | boolean | [NN][DEFAULT false] | Системная роль |
| is_active | boolean | [NN][DEFAULT true] | Активна |
| scope | enum('system', 'filial', 'own') | [NN][DEFAULT 'system'] | Область видимости |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Системные роли:**
- `ADMIN` — Администратор
- `MANAGER` — Менеджер
- `DISPATCHER` — Диспетчер
- `SALES` — Менеджер по продажам
- `OPERATOR` — Оператор
- `DRIVER` — Водитель

---

#### 3.4.2 PERMISSION — Разрешение

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| code | varchar(100) | [UK][NN] | Код (entity.action) |
| entity | varchar(50) | [NN] | Сущность (requests, orders, trips...) |
| action | varchar(50) | [NN] | Действие (create, read, update, delete) |
| name | varchar(200) | [NN] | Наименование |
| description | text | [OD] | Описание |
| is_active | boolean | [NN][DEFAULT true] | Активно |
| created_at | datetime | [NN] | Дата создания |

---

#### 3.4.3 ROLE_PERMISSION — Связь роль-разрешение

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| role_id | uuid | [FK][NN] | Ссылка на роль |
| permission_id | uuid | [FK][NN] | Ссылка на разрешение |
| created_at | datetime | [NN] | Дата создания |

**Связи:**
- ROLE (FK): `role_id → ROLE.id`
- PERMISSION (FK): `permission_id → PERMISSION.id`

---

#### 3.4.4 USER_ROLE — Связь пользователь-роль

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| user_id | uuid | [FK][NN] | Ссылка на пользователя |
| role_id | uuid | [FK][NN] | Ссылка на роль |
| filial_id | uuid | [FK][OD] | Ограничение по филиалу |
| created_at | datetime | [NN] | Дата создания |

**Связи:**
- USER (FK): `user_id → USER.id`
- ROLE (FK): `role_id → ROLE.id`
- FILIAL (FK): `filial_id → FILIAL.id`

---

#### 3.4.5 USER_SESSION — Сессия пользователя

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| user_id | uuid | [FK][NN] | Ссылка на пользователя |
| token_hash | varchar(255) | [NN] | Хеш токена |
| ip_address | varchar(50) | [OD] | IP-адрес |
| user_agent | varchar(500) | [OD] | User Agent |
| expires_at | datetime | [NN] | Срок действия |
| created_at | datetime | [NN] | Дата создания |
| terminated_at | datetime | [OD] | Дата завершения |

**Связи:**
- USER (FK): `user_id → USER.id`

---

### 3.5 Уведомления и события

#### 3.5.1 NOTIFICATION — Уведомление

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| user_id | uuid | [FK][NN] | Получатель |
| type | varchar(50) | [NN] | Тип уведомления |
| title | varchar(200) | [NN] | Заголовок |
| body | text | [OD] | Текст |
| entity_type | varchar(50) | [OD] | Тип связанной сущности |
| entity_id | uuid | [OD] | ID связанной сущности |
| link | varchar(500) | [OD] | Ссылка на объект |
| is_read | boolean | [NN][DEFAULT false] | Прочитано |
| read_at | datetime | [OD] | Дата прочтения |
| channel | enum('system', 'email', 'sms', 'push') | [NN][DEFAULT 'system'] | Канал |
| status | enum('pending', 'sent', 'failed') | [NN][DEFAULT 'pending'] | Статус |
| sent_at | datetime | [OD] | Дата отправки |
| created_at | datetime | [NN] | Дата создания |

**Связи:**
- USER (FK): `user_id → USER.id`

---

#### 3.5.2 NOTIFICATION_SETTING — Настройки уведомлений

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| user_id | uuid | [FK][NN] | Пользователь |
| notification_type | varchar(50) | [NN] | Тип уведомления |
| channel_system | boolean | [NN][DEFAULT true] | В системе |
| channel_email | boolean | [NN][DEFAULT true] | Email |
| channel_sms | boolean | [NN][DEFAULT false] | SMS |
| channel_push | boolean | [NN][DEFAULT true] | Push |
| is_enabled | boolean | [NN][DEFAULT true] | Включено |
| is_muted | boolean | [NN][DEFAULT false] | Без звука |
| created_at | datetime | [NN] | Дата создания |
| updated_at | datetime | [NN] | Дата изменения |

**Связи:**
- USER (FK): `user_id → USER.id`

---

#### 3.5.3 AUDIT_LOG — Журнал аудита

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| user_id | uuid | [FK][OD] | Пользователь |
| action | enum('create', 'read', 'update', 'delete', 'login', 'logout', 'export') | [NN] | Действие |
| entity_type | varchar(50) | [NN] | Тип сущности |
| entity_id | uuid | [OD] | ID сущности |
| old_values | jsonb | [OD] | Предыдущие значения |
| new_values | jsonb | [OD] | Новые значения |
| ip_address | varchar(50) | [OD] | IP-адрес |
| user_agent | varchar(500) | [OD] | User Agent |
| created_at | datetime | [NN] | Дата/время |

**Связи:**
- USER (FK): `user_id → USER.id`

---

#### 3.5.4 EVENT — Событие

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| type | varchar(100) | [NN] | Тип события |
| source | varchar(50) | [NN] | Источник (web, mobile, api) |
| entity_type | varchar(50) | [OD] | Тип сущности |
| entity_id | uuid | [OD] | ID сущности |
| payload | jsonb | [OD] | Данные события |
| user_id | uuid | [FK][OD] | Инициатор |
| created_at | datetime | [NN] | Дата создания |

**Связи:**
- USER (FK): `user_id → USER.id`

---

## 4. Справочники и перечисления

### 4.1 Enum-типы

#### 4.1.1 ENUM: UserStatus

```yaml
UserStatus:
  - active: Активен
  - blocked: Заблокирован
  - deleted: Удалён
```

#### 4.1.2 ENUM: ClientType

```yaml
ClientType:
  - legal: Юридическое лицо
  - individual: Физическое лицо
```

#### 4.1.3 ENUM: ClientGroup

```yaml
ClientGroup:
  - vip: VIP-клиент
  - standard: Стандартный
  - problem: Проблемный
```

#### 4.1.4 ENUM: ContractType

```yaml
ContractType:
  - one_time: Разовый
  - framework: Рамочный
  - annual: Годовой
```

#### 4.1.5 ENUM: PaymentType

```yaml
PaymentType:
  - prepayment: Предоплата
  - postpay_7: Постоплата 7 дней
  - postpay_14: Постоплата 14 дней
  - postpay_30: Постоплата 30 дней
```

#### 4.1.6 ENUM: PaymentStatus

```yaml
PaymentStatus:
  - not_paid: Не оплачен
  - partially_paid: Частично оплачен
  - paid: Оплачен
  - overpaid: Переплата
```

#### 4.1.7 ENUM: OrderStatus

```yaml
OrderStatus:
  - draft: Черновик
  - sent: Отправлен
  - approved: Согласован
  - paid: Оплачен
  - partially_executed: Частично исполнен
  - executed: Исполнен
  - archived: Архив
```

#### 4.1.8 ENUM: RequestType

```yaml
RequestType:
  - auto: Авто
  - railway: ЖД
  - multimodal: Мультимодальная
```

#### 4.1.9 ENUM: RequestStatus

```yaml
RequestStatus:
  - new: Новая
  - calculating: Расчёт
  - offered: Предложена
  - confirmed: Подтверждена
  - in_progress: В работе
  - completed: Завершена
  - cancelled: Отменена
```

#### 4.1.10 ENUM: RequestPriority

```yaml
RequestPriority:
  - normal: Обычный
  - urgent: Срочный
  - express: Экспресс
```

#### 4.1.11 ENUM: RequestFlags

```yaml
RequestFlags:
  - urgent: Срочная
  - fragile: Хрупкий
  - oversize: Негабаритный
  - temp_controlled: Температурный
  - hazmat: Опасный (ADR)
  - express: Экспресс
```

#### 4.1.12 ENUM: PointType

```yaml
PointType:
  - loading: Погрузка
  - unloading: Выгрузка
  - transit: Транзитная
```

#### 4.1.13 ENUM: PackageType

```yaml
PackageType:
  - pallet: Паллета
  - box: Коробка
  - barrel: Бочка
  - container: Контейнер
  - bulk: Насыпной/наливной
  - other: Другое
```

#### 4.1.14 ENUM: VehicleBodyType

```yaml
VehicleBodyType:
  - tent: Тент
  - van: Фургон
  - flatbed: Бортовой
  - tank: Цистерна
  - refrigerator: Рефрижератор
  - container: Контейнеровоз
```

#### 4.1.15 ENUM: VehicleStatus

```yaml
VehicleStatus:
  - available: Доступен
  - in_trip: В рейсе
  - maintenance: На ТО
  - broken: Неисправен
  - reserved: Резерв
```

#### 4.1.16 ENUM: DriverStatus

```yaml
DriverStatus:
  - available: Доступен
  - in_trip: В рейсе
  - vacation: Отпуск
  - sick: Больничный
  - day_off: Выходной
```

#### 4.1.17 ENUM: TripStatus

```yaml
TripStatus:
  - scheduled: Запланирован
  - departed: Выезд
  - in_transit: В пути
  - loading: На погрузке
  - unloading: На выгрузке
  - problem: Проблема
  - completed: Завершён
  - cancelled: Отменён
```

#### 4.1.18 ENUM: CheckpointType

```yaml
CheckpointType:
  - departure: Выезд
  - transit: Транзитная остановка
  - arrival: Прибытие
  - fuel: Заправка
  - custom: Произвольная
```

#### 4.1.19 ENUM: AuditAction

```yaml
AuditAction:
  - create: Создание
  - read: Просмотр
  - update: Изменение
  - delete: Удаление
  - login: Вход
  - logout: Выход
  - export: Экспорт
```

#### 4.1.20 ENUM: NotificationType

```yaml
NotificationType:
  - NEW_REQUEST: Новая заявка
  - REQUEST_STATUS: Изменение статуса заявки
  - NEW_TRIP: Новый рейс
  - TRIP_STATUS: Изменение статуса рейса
  - TRIP_DELAYED: Задержка рейса
  - TASK_OVERDUE: Просроченная задача
  - TRIP_ASSIGNED: Назначение водителю
  - ORDER_CREATED: Новый заказ
  - PAYMENT_RECEIVED: Получена оплата
  - DOCUMENT_READY: Документ готов
```

---

## 5. Аудит изменений

### 5.1 Механизм аудита

Каждая критичная сущность имеет следующие аудируемые поля:

| Поле | Тип | Описание |
|------|-----|----------|
| created_by | uuid | Пользователь, создавший запись |
| created_at | datetime | Дата создания |
| updated_at | datetime | Дата последнего изменения |
| deleted_at | datetime | Дата удаления (мягкое удаление) |
| is_deleted | boolean | Флаг удаления |

### 5.2 Таблица AUDIT_LOG

Фиксирует все изменения данных в системе:

| Поле | Описание | Пример |
|------|----------|--------|
| id | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| user_id | Кто совершил действие | `USER.id` |
| action | Тип действия | `create`, `update`, `delete` |
| entity_type | Таблица/сущность | `requests`, `orders`, `trips` |
| entity_id | ID записи | `REQUEST.id` |
| old_values | JSON предыдущих значений | `{"status": "new"}` |
| new_values | JSON новых значений | `{"status": "confirmed"}` |
| ip_address | IP клиента | `192.168.1.1` |
| user_agent | Браузер/клиент | `Mozilla/5.0...` |
| created_at | Timestamp | `2026-03-20 15:30:00` |

### 5.3 Правила аудита

| Сущность | Аудит полный | Аудит статусов | Аудит удалений |
|----------|--------------|-----------------|----------------|
| USER | ✅ | ✅ | ✅ |
| CLIENT | ✅ | ✅ | ✅ |
| CONTRACT | ✅ | ✅ | ✅ |
| ORDER | ✅ | ✅ | ✅ |
| REQUEST | ✅ | ✅ | ✅ |
| TRIP | ✅ | ✅ | ✅ |
| VEHICLE | ✅ | ✅ | ✅ |
| DRIVER | ✅ | ✅ | ✅ |

---

## 6. Историчность данных

### 6.1 Исторические таблицы статусов

Для ключевых сущностей создаются отдельные таблицы истории статусов.

#### 6.1.1 ORDER_STATUS_HISTORY

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| order_id | uuid | [FK][NN] | Ссылка на заказ |
| status | enum | [NN] | Статус |
| changed_by | uuid | [FK][NN] | Кто изменил |
| changed_at | datetime | [NN] | Когда изменено |
| reason | text | [OD] | Причина изменения |

---

#### 6.1.2 REQUEST_STATUS_HISTORY

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| request_id | uuid | [FK][NN] | Ссылка на заявку |
| status | enum | [NN] | Статус |
| changed_by | uuid | [FK][NN] | Кто изменил |
| changed_at | datetime | [NN] | Когда изменено |
| reason | text | [OD] | Причина изменения |

---

#### 6.1.3 TRIP_STATUS_HISTORY

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| trip_id | uuid | [FK][NN] | Ссылка на рейс |
| status | enum | [NN] | Статус |
| delay_minutes | int | [OD] | Опоздание |
| reason | text | [OD] | Причина / комментарий |
| changed_by | uuid | [FK][NN] | Кто изменил |
| changed_at | datetime | [NN] | Когда изменено |

---

#### 6.1.4 VEHICLE_STATUS_HISTORY

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| vehicle_id | uuid | [FK][NN] | Ссылка на транспорт |
| status | enum | [NN] | Статус |
| trip_id | uuid | [FK][OD] | Связанный рейс |
| mileage | decimal(10,1) | [OD] | Пробег на момент |
| changed_by | uuid | [FK][OD] | Кто изменил |
| changed_at | datetime | [NN] | Когда изменено |

---

#### 6.1.5 DRIVER_STATUS_HISTORY

| Атрибут | Тип | Обязательность | Описание |
|---------|-----|----------------|----------|
| id | uuid | [PK][NN] | Идентификатор |
| driver_id | uuid | [FK][NN] | Ссылка на водителя |
| status | enum | [NN] | Статус |
| trip_id | uuid | [FK][OD] | Связанный рейс |
| hours_worked | decimal(4,1) | [OD] | Часов отработано |
| changed_by | uuid | [FK][OD] | Кто изменил |
| changed_at | datetime | [NN] | Когда изменено |

---

### 6.2 Пример: История статусов заявки

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST_STATUS_HISTORY                       │
├─────────┬───────────────────────────────────────────────────────┤
│ request_id: REQ-2026-0042                                       │
├─────────┬────────────┬─────────────┬────────────────────────────┤
│ id      │ status     │ changed_at  │ changed_by                 │
├─────────┼────────────┼─────────────┼────────────────────────────┤
│ uuid-1  │ new        │ 20.03 09:15 │ Иванов А.                  │
│ uuid-2  │ calculating │ 20.03 09:30 │ Система                    │
│ uuid-3  │ offered     │ 20.03 10:00 │ Иванов А.                  │
│ uuid-4  │ confirmed   │ 20.03 14:30 │ Клиент (email)             │
│ uuid-5  │ in_progress  │ 20.03 15:00 │ Петров С.                  │
│ uuid-6  │ completed    │ 26.03 18:30 │ Петров С.                  │
└─────────┴────────────┴─────────────┴────────────────────────────┘
```

---

## 7. Список таблиц MVP

### 7.1 Таблицы ядра (Core)

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 1 | FILIAL | Филиалы | P0 |
| 2 | USER | Пользователи | P0 |
| 3 | CLIENT | Клиенты | P0 |
| 4 | CONTRACT | Договоры | P1 |
| 5 | ORDER | Заказы | P0 |
| 6 | ORDER_ITEM | Позиции заказа | P0 |
| 7 | REQUEST | Заявки | P0 |
| 8 | POINT | Точки маршрута | P0 |
| 9 | CARGO_ITEM | Позиции груза | P0 |
| 10 | TRIP | Рейсы | P0 |
| 11 | CHECKPOINT | Контрольные точки | P0 |
| 12 | VEHICLE | Транспорт | P0 |
| 13 | DRIVER | Водители | P0 |

### 7.2 Справочники (Reference)

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 14 | REGION | Регионы | P0 |
| 15 | LOCATION | Местоположения | P1 |
| 16 | CARGO_TYPE | Типы грузов | P0 |
| 17 | ROUTE_TEMPLATE | Шаблоны маршрутов | P2 |
| 18 | TARIFF | Тарифы | P2 |

### 7.3 Безопасность (Security)

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 19 | ROLE | Роли | P0 |
| 20 | PERMISSION | Разрешения | P0 |
| 21 | ROLE_PERMISSION | Роль-Разрешение | P0 |
| 22 | USER_ROLE | Пользователь-Роль | P0 |
| 23 | USER_SESSION | Сессии | P0 |

### 7.4 Уведомления и аудит

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 24 | NOTIFICATION | Уведомления | P0 |
| 25 | NOTIFICATION_SETTING | Настройки уведомлений | P1 |
| 26 | AUDIT_LOG | Журнал аудита | P1 |
| 27 | EVENT | События | P1 |

### 7.5 Исторические таблицы

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 28 | ORDER_STATUS_HISTORY | История статусов заказа | P1 |
| 29 | REQUEST_STATUS_HISTORY | История статусов заявки | P0 |
| 30 | TRIP_STATUS_HISTORY | История статусов рейса | P0 |
| 31 | VEHICLE_STATUS_HISTORY | История статусов транспорта | P1 |
| 32 | DRIVER_STATUS_HISTORY | История статусов водителя | P1 |

### 7.6 Операционные

| № | Таблица | Описание | Приоритет |
|---|---------|----------|-----------|
| 33 | PAYMENT | Платежи | P1 |

---

### 7.7 Итоговая сводка

| Категория | Количество таблиц | MVP-таблиц |
|-----------|-------------------|------------|
| Ядро | 13 | 13 |
| Справочники | 5 | 3 |
| Безопасность | 5 | 5 |
| Уведомления/Аудит | 4 | 2 |
| Исторические | 5 | 3 |
| Операционные | 1 | 0 |
| **Итого** | **33** | **26** |

---

## Приложения

### A. Диаграмма связей (ключи)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        СВЯЗИ И ВНЕШНИЕ КЛЮЧИ                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

FILIAL (1)─┬──(N) USER.filial_id
           ├──(N) CLIENT.filial_id
           ├──(N) VEHICLE.filial_id
           └──(N) DRIVER.filial_id

CLIENT (1)─┬──(N) CONTRACT.client_id
           ├──(N) ORDER.client_id
           └──(N) REQUEST.client_id

CONTRACT (1)──(N) ORDER.contract_id

ORDER (1)─┬──(N) ORDER_ITEM.order_id
          └──(N) REQUEST.request_id
          └──(N) PAYMENT.order_id

REQUEST (1)─┬──(N) POINT.request_id
            ├──(N) CARGO_ITEM.request_id
            ├──(N) TRIP.request_id
            └──(N) REQUEST_STATUS_HISTORY.request_id

TRIP (1)─┬──(N) CHECKPOINT.trip_id
         ├──(1) VEHICLE.trip_id (N:1)
         ├──(1) DRIVER.trip_id (N:1)
         └──(N) TRIP_STATUS_HISTORY.trip_id

USER (1)─┬──(N) USER_ROLE.user_id
         ├──(N) NOTIFICATION.user_id
         └──(N) AUDIT_LOG.user_id

ROLE (1)──(N) USER_ROLE.role_id
          └──(N) ROLE_PERMISSION.role_id

PERMISSION (1)──(N) ROLE_PERMISSION.permission_id
```

---

### B. Ограничения целостности

| Тип ограничения | Реализация |
|-----------------|------------|
| Первичный ключ | UUID, NOT NULL, UNIQUE |
| Внешний ключ | ON DELETE RESTRICT или SET NULL |
| Обязательность | NOT NULL для критичных полей |
| Уникальность | UNIQUE INDEX |
| Значения по умолчанию | DEFAULT value |
| Проверка значений | CHECK constraint или enum |
| Мягкое удаление | WHERE is_deleted = false |

---

### C. Рекомендации по индексации

| Таблица | Индекс | Тип | Описание |
|---------|--------|-----|----------|
| USER | email | B-tree | Поиск по email (логин) |
| CLIENT | inn | B-tree | Поиск по ИНН |
| CLIENT | filial_id | B-tree | Фильтр по филиалу |
| ORDER | number | B-tree | Поиск по номеру |
| ORDER | client_id, status | B-tree | Фильтры |
| ORDER | created_at | B-tree | Сортировка по дате |
| REQUEST | number | B-tree | Поиск по номеру |
| REQUEST | status | B-tree | Фильтр по статусу |
| REQUEST | client_id | B-tree | Фильтр по клиенту |
| REQUEST | assigned_to | B-tree | Задачи ответственного |
| REQUEST | created_at | B-tree | Сортировка |
| TRIP | number | B-tree | Поиск по номеру |
| TRIP | driver_id, status | B-tree | Активные рейсы водителя |
| TRIP | vehicle_id, status | B-tree | Активные рейсы транспорта |
| VEHICLE | plate_number | B-tree | Поиск по номеру |
| DRIVER | phone | B-tree | Поиск по телефону |
| DRIVER | status | B-tree | Доступные водители |
| AUDIT_LOG | entity_type, entity_id | B-tree | История изменений |
| AUDIT_LOG | user_id, created_at | B-tree | Логи пользователя |
| NOTIFICATION | user_id, is_read | B-tree | Непрочитанные |

---

**Документ подготовлен для:**
- [ ] Review Solution Architect
- [ ] Review Backend Team
- [ ] Review Database Administrator
- [ ] Согласование с Product Owner

**История версий:**

| Версия | Дата | Автор | Изменения |
|--------|------|-------|-----------|
| 0.1 | 20.03.2026 | Data Architecture Team | Initial draft |
