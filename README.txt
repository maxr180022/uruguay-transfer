RusWeo 3.0 — unified Telegram Mini App + Android WebView
===========================================================
Updated: 06.09.2026

CURRENT ARCHITECTURE
--------------------
One Web App:
https://maxr180022.github.io/uruguay-transfer/

Consumers:
- Telegram Mini App
- Android RusWeo 3.0 native WebView shell

Backend:
- existing Google Apps Script deployment

Android:
- versionName 3.0
- current test: versionCode 86
- applicationId com.uruway.transfer
- RusWeo 2.8.2 / code84 remains rollback baseline until code86 passes E2E.

IMPORTANT
---------
GitHub is the UI source, but Android renders the Web App INSIDE its own WebView.
The main RusWeo UI must not open in Chrome.

Android keeps native capabilities:
- notification channel / POST_NOTIFICATIONS
- client status polling
- driver foreground/background polling
- StatusAlarmReceiver
- DriverPollReceiver
- DriverForegroundService
- BookingStore
- UruWayAndroid JS bridge
- Waze / Google Maps / Telegram intents
- Android Back handling

STARTUP RULE
------------
The launch sequence must be visually identical in Telegram and Android:
1. branded splash/video presentation
2. role/session verification runs behind the presentation
3. after presentation:
   - authorized client -> client UI
   - authorized driver -> driver UI
   - no valid Android session -> Telegram login gate
4. Telegram login opens Telegram app, not Chrome
5. after confirmation, return to RusWeo and finish auth immediately

WEB FILES
---------
index.html
booking.html
driver.html
guide.html
news.html
privacy.html
rusweo-platform.js
rusweo-auth.js
rusweo_app_icon.png
rusweo_logo.png
rusweo_splash_v1_0_3.mp4

The shared adapters currently live in the repository ROOT:
- rusweo-platform.js
- rusweo-auth.js

Do not move them to /js unless every HTML reference is changed at the same time.

UPDATE RULE
-----------
UI-only change:
- update GitHub files once
- Telegram and Android receive the same UI
- no APK/AAB rebuild

Backend change:
- update Code.gs in the EXISTING Apps Script project
- create a new version of the EXISTING deployment
- keep the same Web App URL

Native Android change:
- increment versionCode
- rebuild APK/AAB
- test notifications, auth, client and driver E2E

CODE86 FIXES
------------
- GitHub Pages host is allowlisted inside Capacitor WebView.
- Main app no longer intentionally navigates to Chrome.
- Android auth gate is hidden while splash/video plays.
- saved session/role verification happens behind splash.
- driver redirect waits until the presentation ends.
- Android resume triggers immediate Telegram-auth recheck.
- Telegram links prefer the Telegram Android app.
- index/driver shared adapter cache key -> v3002.
- Android driver build marker -> RusWeo 3.0.
- native notification/background services preserved.

GITHUB UPDATE FOR CODE86
------------------------
Replace:
- index.html
- driver.html
- README.txt

Do NOT replace for this fix:
- booking.html
- guide.html
- news.html
- privacy.html
- rusweo-platform.js
- rusweo-auth.js
- Code.gs

TEST BEFORE GOOGLE PLAY
-----------------------
Client:
- splash/video first
- auth hidden behind splash
- Telegram login if required
- return to app
- create booking
- status notification in background

Driver:
- automatic role
- splash/video first
- New / Accepted / History / Finance
- Telegram direct contact
- Waze / Google Maps
- lifecycle / odometer / expenses / completion
- background new-order notifications

Corporate:
- corporate_access
- corporate booking lifecycle
- close order / amount / currency / odometer

Do not publish code86 until these real-device tests pass.
