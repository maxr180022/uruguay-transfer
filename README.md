# UruWay Transfer — Android / Telegram / Mini App

Текущая контрольная версия: **V44 / 44.0**  
Дата фиксации: **29.08.2026**

UruWay — единая система бронирования трансфера, в которой связаны:

- Android-приложение клиента;
- Android-кабинет водителя STANDARD;
- Telegram-бот;
- Telegram Mini App / web-интерфейс;
- Google Apps Script backend;
- Google Calendar STANDARD;
- система чатов клиент ↔ водитель;
- статусы заказов и уведомления;
- E2E/self-check диагностика.

## Текущая архитектура

### Telegram Bot
`@UruguayDriver_bot`

### Telegram Mini App
`https://maxr180022.github.io/uruguay-transfer/`

### Google Apps Script Web App
`https://script.google.com/macros/s/AKfycbzWkerEeWR-3EjY1QW44Az6pj1TjJK9_ktfnrdcgFILlD6Cnqb4z2X97zSknKRJw-i3jw/exec`

На текущем этапе Android и Telegram работают напрямую через Google Apps Script.
Переход на собственный API-домен может быть выполнен позднее параллельно, без отключения этой рабочей схемы.

## Состав репозитория

### Корень
- `index.html` — клиентская главная / Telegram Mini App;
- `booking.html` — форма и логика бронирования;
- графические ресурсы UruWay;
- Gradle-конфигурация Android.

### `SERVER/`
- `Code.gs` — полный backend:
  - Telegram bot;
  - Telegram polling;
  - Android API;
  - авторизация Android через Telegram;
  - бронирования;
  - водительские статусы;
  - клиентский и водительский чат;
  - Google Calendar;
  - партнёрские переходы;
  - health/self-check;
  - E2E проверки.

### `app/src/main/assets/public/`
Встроенная web-часть Android:
- `index.html`
- `booking.html`
- `driver.html`
- изображения / ресурсы.

### `app/src/main/java/com/uruway/transfer/`
Нативная Android-часть:
- WebView bridge;
- Android ↔ JavaScript;
- Telegram auth bridge;
- фоновые проверки заказов;
- push/status notifications;
- push чата;
- driver polling;
- alarm receivers;
- API client.

## Роли

### Клиент
После Telegram-авторизации обычный пользователь получает роль `client`.

Возможности:
- создание STANDARD-заказа;
- просмотр активного заказа;
- история заказов;
- чат с водителем;
- отмена заказа;
- Telegram-уведомления;
- Android-уведомления;
- смена кабинета.

### Водитель STANDARD
Авторизованный администратор получает роль `driver_standard`.

Возможности:
- новые / принятые / история;
- принятие и отклонение;
- статусы:
  - подтверждён;
  - водитель выехал;
  - поездка начата;
  - поездка завершена;
- чат с клиентом;
- Telegram-дублирование;
- Google Calendar;
- автоматический self-check;
- ручная проверка системы;
- ручная проверка Telegram.

### BUSINESS
BUSINESS **не является внутренним классом водителя UruWay**.
Это партнёрское направление Hyundai H-1.

## Проверка системы

В водительском Android-кабинете работает постоянная автоматическая проверка.

Также доступны:
- `Проверить систему`
- `Проверить Telegram`

Проверяются Android bridge, сервер, API, Telegram, Calendar, storage, auth, chat, statuses, routing и другие ключевые узлы.

Синтетические проверки должны удалять тестовые сообщения / события / записи после выполнения.

## Google Calendar STANDARD

Заказ блокирует нужный временной интервал.

При завершении поездки система должна удалить связанное событие Calendar.
В текущей V44 добавлен fallback-поиск события по номеру заявки и временному окну, если Google Calendar не находит событие по сохранённому `eventId`.

## Чат

Чат клиента и водителя хранится в заявке и синхронизируется с Telegram.

Статусы сообщений:
- Отправлено;
- Доставлено;
- Прочитано.

Telegram остаётся резервным и внешним каналом: сообщения приложения дублируются соответствующей стороне в Telegram.

## Android version

```text
versionCode 44
versionName 44.0
```

## Сборка Android

Рабочее окружение пользователя:

```text
JAVA_HOME=C:\Users\RICCO\.jdks\jbr-21.0.11
```

Одна команда PowerShell:

```powershell
cd "C:\Users\RICCO\OneDrive\Desktop\UruWay_Android"; $env:JAVA_HOME="C:\Users\RICCO\.jdks\jbr-21.0.11"; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\gradlew.bat clean; if ($LASTEXITCODE -eq 0) { .\gradlew.bat assembleDebug }; if ($LASTEXITCODE -eq 0) { Write-Host "`nГОТОВО: C:\Users\RICCO\OneDrive\Desktop\UruWay_Android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green; Start-Process "C:\Users\RICCO\OneDrive\Desktop\UruWay_Android\app\build\outputs\apk\debug" }
```

Debug APK:

```text
app\build\outputs\apk\debug\app-debug.apk
```

## Обновление Google Apps Script

После изменения `SERVER/Code.gs`:

1. открыть Google Apps Script;
2. полностью заменить `Code.gs`;
3. сохранить;
4. `Deploy`;
5. `Manage deployments`;
6. редактировать действующий Web App;
7. `New version`;
8. `Deploy`.

Существующий Web App URL должен оставаться прежним.

## Web / GitHub

Для GitHub Pages рабочими публичными файлами являются:

- `index.html`
- `booking.html`
- используемые изображения / ресурсы.

Главный файл сайта всегда должен называться `index.html`.

## Важное правило развития

V44 — контрольная точка на 29.08.2026.

Перед любым следующим большим изменением:
1. не ломать рабочую Telegram-связку;
2. сохранять рабочий Apps Script deployment;
3. сначала поднимать новую инфраструктуру параллельно;
4. прогонять E2E;
5. только после этого переключать production.

Собственный домен в дальнейшем можно использовать одновременно для:
- публичного сайта;
- Mini App;
- API;
- status endpoint.

Например:
- основной домен — сайт;
- `app.` — приложение;
- `api.` — API.

При таком переходе текущий Apps Script можно оставить рабочим до полной проверки новой схемы.
