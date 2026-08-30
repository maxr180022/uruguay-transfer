UruWay V45.2 — VERIFIED GUIDE + PARTNER CLICKS + NEWS

WHAT IS VERIFIED
- Existing Telegram news publishing remains in uruway-news-bot.js.
- After a Russian post is successfully sent to Telegram, the same prepared news item is saved to NEWS_KV.
- /api/news returns the saved items with CORS enabled for GitHub Pages.
- guide.html fetches news only when the user opens the News accordion.
- NO push/news notification code was added to Telegram Mini App or Android.
- Partner button click is recorded before Telegram is opened.
- Pavel = documents / @mapsme; Nikita = realestate / @niko_uruguay.
- Telegram partner message is prefilled with UruWay source text.
- Admin «Партнёрские переходы» counts EVERY real click. Only a duplicate request with the same lead_click_id is ignored.
- Detail buttons «Документы» and «Недвижимость» open their corresponding click lists.
- Existing general user/start counters are untouched.

DEPLOY ORDER
1. Apps Script — replace Code.gs and update the existing Web App deployment/version so the public /exec endpoint continues to serve the new code.
2. Cloudflare Worker uruway-news-bot — replace Worker code with uruway-news-bot.js and deploy. DO NOT change NEWS_KV, AI, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PUBLISH_ENABLED or Cron bindings.
3. GitHub Pages — replace only guide.html.

CHECK AFTER DEPLOY
- Open Apps Script Web App /exec normally: existing app endpoint must respond as before.
- In Telegram admin menu open «🤝 Партнёрские переходы».
- Deploy Worker and open /health: publicNews must be true.
- Open /api/news?limit=5: it may initially return an empty items array until the updated Worker publishes a NEW news item.
- After the next scheduled published Telegram news, the same item must appear in /api/news and then in Guide > News.
- Existing old Telegram messages are not backfilled.
