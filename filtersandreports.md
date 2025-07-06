# Терминология

_Этот раздел предназначен для фиксации и согласования ключевых терминов, используемых в отчетах, фильтрах и аналитике. По мере работы дополняй и уточняй определения._

- **Conversion (Конверсия):** ...
- **Unique Clicks (Уникальные клики):** ...
- **Registrations (Регистрации):** ...
- **FTD (First Time Deposit):** ...
- **Deposit:** ...
- **Traffic Source (Источник трафика):** ...
- **Partner (Партнер):** ...
- **Campaign (Кампания):** ...
- **Landing (Лендинг):** ...
- **Device Type (Тип устройства):** ...
- **CR (Conversion Rate):** ...
- **FTD Rate:** ...
- **Breakdown (Группировка):** ...
- **Funnel (Воронка):** ...

---

**Требования к отображению конверсий:**
- Все конверсии (этапы воронки) в отчетах должны показываться в процентах (например, V2R = 12.5%).
- Аббревиатуры для этапов всегда использовать в виде: V2R (Visit→Reg), R2D (Reg→Dep), V2D (Visit→Dep).

---

# Reports & Filters Planning

## 1. Conversions Dashboard

### Displays
- **Unique Clicks:** SUM(unique_clicks)
- **Registrations:** SUM(registrations_count)
- **FTD (First Time Deposits):** SUM(ftd_count)

### Chart
- Interactive Area Chart
- Switchable views:
  - General (Unique Clicks, Registrations, FTD)
  - Visit-to-Registration funnel
  - Registration-to-FTD funnel
- Daily and weekly views

### Filters
#### Common Filters (shared with other reports):
- Date range (daily/weekly)
- Country
- Partner
- Campaign
- Device type

#### Specific Filters (only for conversions):
- Traffic Source
- Foreign Brand ID
- Foreign Landing ID

### Filter Portability
- Общие фильтры должны быть переносимы между отчетами (например, дата, страна, партнер, кампания, устройство)
- Специфичные фильтры игнорируются при переходе в другой отчет, если он их не поддерживает

---

_Добавляй новые отчеты и фильтры ниже по мере планирования_ 