RusWeo 3.0 · code87 — ЕДИНЫЙ ДИЗАЙН TELEGRAM + ANDROID
==========================================================
Актуально: 06.09.2026

ГЛАВНОЕ ПРАВИЛО
----------------
В RusWeo существует ОДИН клиентский дизайн.
Telegram Mini App и Android WebView используют один и тот же DOM/CSS/JS из index.html.
Отдельный старый Android Client Hub V43 физически удалён из index.html: нет legacy DOM, legacy CSS и legacy controller.

ЧТО ИСПРАВЛЕНО В code87
------------------------
1. Удалён альтернативный Android-клиентский интерфейс.
2. Android теперь показывает тот же современный экран, что Telegram.
3. Личный кабинет/текущий заказ/история/чат работают через один общий UI:
   - Telegram -> signed initData backend API
   - Android -> native session + UruWayAndroid.clientAppApiV35
4. Splash/video остаётся единым стартовым экраном.
5. Android проверяет сохранённую Telegram-авторизацию и роль за splash/video.
6. На корневом экране Android кнопка Back больше не делает WebView.goBack() и не создаёт белый экран.
7. Back на корневом экране сворачивает приложение через moveTaskToBack(true).
8. Приложение остаётся в фоне; native polling/alarms/foreground driver service не удалены.
9. Добавлен UruWayAndroid.minimizeApp() для web-кнопки Назад.

ВЕРСИЯ
-------
versionName: 3.0
versionCode: 87
applicationId: com.uruway.transfer

GITHUB — ЗАМЕНИТЬ
------------------
- index.html
- driver.html
- README.txt

НЕ МЕНЯТЬ ДЛЯ ЭТОГО ПАТЧА
--------------------------
- Code.gs
- booking.html
- guide.html
- news.html
- privacy.html
- rusweo-platform.js
- rusweo-auth.js

ANDROID BACKGROUND
------------------
Сохранены нативные механизмы:
- NotificationHelper
- POST_NOTIFICATIONS
- BookingStore
- StatusAlarmReceiver
- DriverPollReceiver
- DriverForegroundService
- trackBooking
- driver polling/accounting/auth bridges

При нажатии Back на корневом экране Activity не уничтожается: задача уходит в фон.
Это принципиально отличается от finish() и от WebView.goBack().

ПРОВЕРКА ПЕРЕД СБОРКОЙ
-----------------------
1. Загрузить index.html, driver.html, README.txt из GITHUB_REPLACE.
2. Дождаться успешного GitHub Pages deployment.
3. Запустить CHECK_WEB_READY.cmd.
4. Должно быть WEB APP READY FOR ANDROID 3.0 code87.
5. Запустить BUILD_TEST_APK.cmd.
6. Получить Desktop\RusWeo_3.0_87_TEST.apk.

ОБЯЗАТЕЛЬНЫЙ ТЕСТ
------------------
- Telegram и APK: визуально одна и та же Главная.
- APK: splash/video при холодном запуске.
- APK: проверка входа не перекрывает видео.
- APK client: Кабинет показывает текущий заказ/историю/чат.
- APK driver: водительский кабинет после определения роли.
- Back на корневом клиентском экране -> приложение сворачивается.
- Back на корневом водительском экране -> приложение сворачивается.
- Возврат из Recent Apps -> RusWeo продолжает работу.
- Уведомления клиента в фоне.
- Уведомления водителя в фоне.

ROLLBACK
--------
До прохождения реального теста code87 версия RusWeo 2.8.2 / code84 остаётся контрольной резервной точкой.
