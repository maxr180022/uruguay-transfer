RusWeo 3.0 — ЕДИНАЯ WEB-АРХИТЕКТУРА + ANDROID SHELL
=======================================================
Актуально: 06.09.2026

СТАТУС
------
Публичная версия проекта: RusWeo 3.0

Текущая схема:
- Telegram Mini App -> общий Web App на GitHub Pages
- Android RusWeo 3.0 -> тот же Web App внутри нативного Android WebView
- Google Apps Script -> единый backend
- Android сохраняет нативные функции: уведомления, фоновые проверки, карты,
  Android-авторизацию, системные разрешения и Android bridge

Стабильная резервная точка до завершения тестирования Android 3.0:
- RusWeo 2.8.2
- Android versionCode 84

Первый Android 3.0 test shell:
- versionName: 3.0
- versionCode: 85
- applicationId: com.uruway.transfer
- статус: TEST, до проверки не публиковать в Google Play


WEB APP / GITHUB
----------------
Основной репозиторий:
maxr180022/uruguay-transfer

Основной Web App:
https://maxr180022.github.io/uruguay-transfer/

Проверено в репозитории — необходимые runtime-файлы находятся на месте:

- index.html
- booking.html
- driver.html
- guide.html
- news.html
- privacy.html
- rusweo-platform.js
- rusweo-auth.js
- rusweo_app_icon.png
- rusweo_logo.png
- rusweo_splash_v1_0_3.mp4

ВАЖНО:
rusweo-platform.js и rusweo-auth.js сейчас находятся В КОРНЕ репозитория.
Не переносить их в /js без одновременного изменения ссылок в HTML.

Текущий driver.html правильно подключает:
- rusweo-platform.js?v=3001
- rusweo-auth.js?v=3001

Текущий driver.html соответствует подготовленному патчу Android/Web RusWeo 3.0.

Текущий index.html сохраняет существующую встроенную Android bridge-логику.
На этапе первого теста Android 3.0 это сделано специально:
не удалять старые Android bridge-блоки до прохождения полного теста.


ЧТО ТЕПЕРЬ ЯВЛЯЕТСЯ ЕДИНЫМ
---------------------------
Интерфейс больше не должен отдельно копироваться в Telegram и Android.

Изменения Web UI делаются на GitHub:
- главная страница -> index.html
- бронирование -> booking.html
- водитель -> driver.html
- гид -> guide.html
- новости -> news.html
- privacy -> privacy.html

После обновления GitHub Pages новое содержимое получают:
1. Telegram Mini App
2. Android RusWeo 3.0 WebView

APK/AAB НЕ нужно пересобирать из-за обычных изменений HTML/CSS/JS.


КОГДА НУЖНА НОВАЯ ANDROID-СБОРКА
--------------------------------
APK/AAB требуется только при изменении нативной Android-части, например:
- Android notification logic
- background polling / foreground service
- Android permissions
- WebView настройки
- Android bridge API
- deep links
- Waze / Google Maps intents
- Android SDK / Gradle / manifest
- нативная авторизация
- системная кнопка Back
- иконка приложения или иные нативные ресурсы


ANDROID 3.0 — НАТИВНЫЕ УВЕДОМЛЕНИЯ
----------------------------------
Уведомления НЕ переведены в Web Notification API.

В Android 3.0 сохраняются нативные Android-механизмы:
- NotificationHelper.createChannel
- Android 13+ POST_NOTIFICATIONS permission
- UruWayAndroid.trackBooking()
- BookingStore tracked tokens
- StatusAlarmReceiver
- NotificationHelper.notifyStatus()
- DriverPollReceiver
- DriverForegroundService
- foreground/background status polling

Это означает:
Web-интерфейс может обновляться через GitHub,
а Android продолжает получать уведомления через нативную оболочку.


ANDROID 3.0 — ПРОВЕРЕННЫЕ МАРКЕРЫ ПАКЕТА CODE85
------------------------------------------------
В подготовленном test shell присутствуют:
- WEB_APP_URL
- loadUrl(remoteUrl)
- NotificationHelper.createChannel
- requestNotificationPermissionIfNeeded
- Manifest.permission.POST_NOTIFICATIONS
- StatusAlarmReceiver.schedule
- NotificationHelper.notifyStatus
- BookingStore.getTrackedTokens
- DriverForegroundService.start
- DriverPollReceiver.pollNow
- trackBooking
- UruWayAndroid bridge

Основной URL Android WebView:
https://maxr180022.github.io/uruguay-transfer/


BACKEND / GOOGLE APPS SCRIPT
----------------------------
Backend остаётся в существующем Google Apps Script проекте.

ВАЖНО:
- не создавать новый Apps Script проект
- не удалять Script Properties
- не пересоздавать Google Sheets
- не менять Web App URL без отдельной миграции
- при обновлении Code.gs создавать новую версию СУЩЕСТВУЮЩЕГО deployment

Версия deployment Google Apps Script и публичная версия RusWeo — разные вещи.

Пример:
- RusWeo: 3.0
- Apps Script deployment version: может быть 84, 85, 86 и т.д.


КАК ОБНОВЛЯТЬ ПРОЕКТ ПОСЛЕ ПЕРЕХОДА НА 3.0
-------------------------------------------
Если меняется только интерфейс:
1. Изменить нужный HTML/JS на GitHub.
2. Commit changes.
3. Дождаться GitHub Pages.
4. Проверить Telegram.
5. Проверить Android 3.0.
6. APK пересобирать не нужно.

Если меняется backend:
1. Заменить Code.gs в существующем Apps Script.
2. Deploy -> Manage deployments.
3. Edit существующий Web App deployment.
4. New version.
5. Сохранить тот же Web App URL.
6. Запустить "Проверить систему".

Если меняется нативный Android:
1. Увеличить versionCode.
2. При необходимости изменить versionName.
3. Собрать новый APK/AAB.
4. Проверить клиентскую и водительскую части.
5. Только потом публиковать.


СБОРКА ANDROID 3.0 CODE85
-------------------------
Используется пакет:
RusWeo_3.0_85_ANDROID_WEBVIEW_PUSH_TEST_ROOTJS.zip

Перед сборкой:
1. Распаковать пакет.
2. Убедиться, что рядом доступен рабочий Android-проект UruWay_Android.
3. Запустить CHECK_WEB_READY.cmd.
4. Все Web URL должны быть OK.
5. Запустить BUILD_TEST_APK.cmd.

Сборщик:
- проверяет GitHub Web App
- проверяет наличие ключевых notification/service markers
- делает backup MainActivity.java и app/build.gradle
- ставит patch RusWeo 3.0
- выполняет clean + assembleRelease
- создаёт:
  Desktop\RusWeo_3.0_85_TEST.apk

Сборщик не должен удалять:
- service classes
- assets/public
- остальную рабочую Android-архитектуру


ОБЯЗАТЕЛЬНЫЙ ТЕСТ ANDROID 3.0
-----------------------------
КЛИЕНТ:
- запуск приложения
- splash/video
- Android/Telegram авторизация
- создание заказа
- разрешение уведомлений
- отслеживание заказа
- изменение статуса заказа
- нативное Android-уведомление в фоне
- повторный запуск
- личный кабинет / текущая поездка

ВОДИТЕЛЬ:
- автоматическое определение роли
- Новые
- Принятые
- История
- Финансы
- компактные карточки
- прямой переход по @username в Telegram
- Waze
- Google Maps
- звонок
- сообщение
- начало поездки
- одометр
- расходы
- завершение поездки
- post-trip сообщение клиенту
- фоновые уведомления о новых заказах

КОРПОРАТИВНЫЕ:
- corporate_access
- корпоративное бронирование
- принятие
- жизненный цикл
- завершение
- итоговая сумма/валюта/одометр

ДИАГНОСТИКА:
- Проверить систему
- Telegram Bot API
- Google Sheets
- Script Properties
- Calendar
- маршруты A/B/C
- права доступа
- карточки водителя 3.0
- post-trip review
- корпоративный доступ
- финансы 3.0
- партнёрские переходы


ПРАВИЛО БЕЗОПАСНОГО ОБНОВЛЕНИЯ
------------------------------
До полного прохождения Android 3.0 теста:
- RusWeo 2.8.2 остаётся rollback baseline
- code85 не публиковать в Google Play
- не удалять старую Android native logic
- не удалять совместимость с legacy данными
- не очищать Script Properties / Sheets / Calendar
- не менять applicationId


ТЕКУЩАЯ СТРУКТУРА GITHUB
------------------------
uruguay-transfer/
|-- index.html
|-- booking.html
|-- driver.html
|-- guide.html
|-- news.html
|-- privacy.html
|-- rusweo-platform.js
|-- rusweo-auth.js
|-- rusweo_app_icon.png
|-- rusweo_logo.png
|-- rusweo_splash_v1_0_3.mp4
|-- README.txt
|-- SHA256SUMS.txt
`-- VERIFICATION.txt

ПРИМЕЧАНИЕ ПО ДОКУМЕНТАЦИИ:
Старый README.txt в репозитории описывает RusWeo 2.4 и устарел.
Его нужно заменить этим README RusWeo 3.0.

Старые SHA256SUMS.txt и VERIFICATION.txt являются документацией предыдущих
сборок и не должны использоваться как подтверждение файлов RusWeo 3.0,
пока не будут пересчитаны отдельно.


КОНТРОЛЬНАЯ ТОЧКА 06.09.2026
----------------------------
Проверено:
[OK] основные HTML-файлы присутствуют
[OK] driver.html присутствует
[OK] rusweo-platform.js присутствует в корне
[OK] rusweo-auth.js присутствует в корне
[OK] driver.html ссылается на JS в корне
[OK] driver.html совпадает с подготовленным ROOTJS patch
[OK] Android test shell: versionName 3.0
[OK] Android test shell: versionCode 85
[OK] applicationId сохранён com.uruway.transfer
[OK] Android shell загружает общий GitHub Web App
[OK] в Android patch присутствуют native notification/background markers

Не считается подтверждённым до реального теста на телефоне:
- фактическая доставка Android уведомлений в фоне
- поведение OEM battery restrictions
- полный клиентский E2E в APK
- полный водительский E2E в APK
- Google Play release build

После прохождения этих тестов code85 можно считать кандидатом на RusWeo 3.0 release.


ГЛАВНЫЙ ПРИНЦИП RUSWEO 3.0
--------------------------
ОДИН Web App -> Telegram + Android
ОДИН backend -> Google Apps Script
Android APK -> тонкая нативная оболочка для системных возможностей

Обычные изменения интерфейса делаются один раз на GitHub
и становятся общими для Telegram и Android.
