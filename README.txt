RusWeo 2.4 — Telegram Mini App / Backend
========================================

PUBLIC NAME
-----------
Application name: RusWeo
Public upload archive name: RusWeo.zip
Version: 2.4

IMPORTANT:
The public application name must remain "RusWeo" without the version number.
The version number is stored separately and must not be appended to the app name or archive filename.

BASELINE
--------
RusWeo 2.4 was built on top of:
RusWeo 2.3 MASTER BUILD 69 FULL RECOVERY
Telegram/backend baseline: deployment 66
Android baseline: versionCode 69 (Android is NOT changed by this Telegram package)

FILES CHANGED IN 2.4
--------------------
1. Code.gs
   Main Telegram/backend update.

2. booking.html
   Compatibility/version marker updated for backend 2.4.
   Existing booking UI/logic is otherwise preserved.

FILES PRESERVED BYTE-FOR-BYTE FROM MASTER 2.3
----------------------------------------------
- index.html
- guide.html
- news.html
- privacy.html
- rusweo_app_icon.png
- rusweo_logo.png
- rusweo_splash_v1_0_3.mp4

These files are included in the complete recovery package only.
They do NOT need to be replaced during a minimal 2.3 -> 2.4 update because their contents are unchanged.

VERSION / DOCUMENTATION FILES
-----------------------------
- APP_VERSION.txt
- README_RUSWEO_2.4.txt

NEW 2.4 FUNCTIONALITY
---------------------
- Compact Telegram driver/admin order card.
- Detailed order information is preserved and moved into sections:
  * Route
  * Contacts
  * Calculation
- Tips for completed orders:
  * UYU
  * USD
  * original amount/currency preserved
  * UYU equivalent stored for monthly accounting
  * tips can be changed or deleted
- Monthly report improvements:
  * completed orders only
  * number of completed orders
  * total working hours
  * total actual monthly mileage
  * income per working hour
  * order revenue
  * tips
  * total income in UYU
  * trip expenses
  * IP/business expenses
  * net monthly result
- Separate IP/business expense ledger.
- 12-month monthly report history/navigation.
- Additional protection against unfinished orders entering monthly accounting.
- Recovery/synchronization of completed old orders into accounting when required.

DATA PRESERVATION RULES
-----------------------
RusWeo 2.4 is an additive update. It must NOT clear, recreate or replace the live project storage.

Existing data remains in the existing live Google Apps Script project / connected sheets:
- BOOKING_* Script Properties
- current booking numbers/counters
- existing bookings
- booking statuses
- client names and contacts
- Telegram IDs/usernames
- route addresses
- dates/times
- odometer values
- expenses
- calendar links/state
- trip accounting rows
- monthly report rows

The new compact card does not delete this information. It only changes where the driver sees it.

DEPLOYMENT — SAFE UPDATE
------------------------
DO NOT create a new Google Apps Script project.
DO NOT delete Script Properties.
DO NOT delete or recreate the current Sheets.
DO NOT create a new Web App URL unless specifically required by a future migration.

For a minimal Telegram 2.3 -> 2.4 update:
1. Open the EXISTING RusWeo Google Apps Script project.
2. Replace/update Code.gs with the 2.4 Code.gs.
3. Update booking.html only where that file is currently hosted/deployed.
4. Deploy a NEW VERSION of the EXISTING Web App deployment.
5. Keep the existing Web App URL.
6. Verify current active and historical orders before and after deployment.
7. Test one unfinished order: it must not appear in the completed monthly totals.
8. Test one completed order: it must appear in monthly totals.
9. Test tips in UYU and USD.
10. Test adding/removing an IP/business expense.

DO NOT REPLACE JUST BECAUSE INCLUDED
------------------------------------
The following files are unchanged and do not need to be re-uploaded during a minimal update:
index.html, guide.html, news.html, privacy.html,
rusweo_app_icon.png, rusweo_logo.png, rusweo_splash_v1_0_3.mp4.

BACKEND BUILD
-------------
Public version: 2.4
Backend build marker: RUSWEO_2.4_TELEGRAM_ACCOUNTING_20260904_0001

RECOVERY PRINCIPLE
------------------
RusWeo 2.3 MASTER BUILD 69 remains the untouched recovery baseline.
RusWeo 2.4 must be deployed as an update over the existing live Telegram/backend environment,
not as a fresh installation.
