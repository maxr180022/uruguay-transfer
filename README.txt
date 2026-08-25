URUGUAY TRANSFER — V23 FINAL AUDITED

Code.gs lines: 3507
SHA-256: f061dd8ed8a3c2b108619bf37d48b17e47bd2f4f033abb93eaaf906d7e9c8adc

STATIC AUDIT RESULTS:
- OK: Code.gs JavaScript syntax
- OK: booking.html inline JavaScript syntax
- OK: index.html inline JavaScript syntax
- OK: No duplicate function definitions
- OK: No unresolved internal *_() helper calls
- OK: All critical functions present
- OK: PREPAYMENT_HOURS = 2
- OK: Work calendar ID present
- OK: Calendar helper present once
- OK: Manual calendar merge present
- OK: Corporate list preserved
- OK: Calendar only after receipt for ordinary booking
- OK: Corporate reserves immediately

Проверено:
- синтаксис Code.gs;
- синтаксис JS в booking.html и index.html;
- отсутствие дублирующихся функций;
- отсутствие потерянных внутренних helper-функций;
- наличие getWorkCalendar_();
- чтение ручных записей рабочего Google Calendar;
- объединение календаря с активными и ближайшими заявками;
- сохранение отдельной кнопки корпоративных заявок;
- 2 часа на предоплату;
- обычная заявка не блокирует календарь до чека;
- корпоративная заявка резервируется после подтверждения;
- ошибки календаря в админских кнопках теперь выводятся сообщением, а не молча.

Ограничение проверки:
Статический аудит не может подтвердить внешние разрешения Google Calendar, Telegram API,
Drive/Sheets permissions или состояние триггеров в реальном аккаунте. Это проверяется только после развертывания.