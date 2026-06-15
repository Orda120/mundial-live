# מונדיאל 2026 · ליגת החברים ⚽

אפליקציית ליגת הימורים פרטית למונדיאל 2026 — דראפט נבחרות חי, הימורי 1/X/2 ונוקאאוט, ניחוש מסלול מוקדם, טבלת ניקוד וסימולטור תרחישים עם עץ טורניר אוטומטי.

הכול מסתנכרן **בזמן אמת** בין כל החברים (Firebase Realtime Database) — דראפט לייב בלי לרענן.

## מה צריך

- Node.js 18 ומעלה
- חשבון Google (לפרויקט Firebase חינמי — בלי כרטיס אשראי)

## הקמה — חמש דקות

**1. יוצרים פרויקט Firebase**

1. נכנסים אל [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (אפשר לכבות Analytics).
2. בתפריט הצד: **Build → Realtime Database → Create Database** → בוחרים אזור (למשל `europe-west1`) → מצב **locked mode**.
3. בלשונית **Rules** של ה־Database מדביקים את התוכן של `database.rules.json` שבתיקייה הזו ומפרסמים (Publish). הכללים פותחים קריאה/כתיבה רק תחת `leagues/` — קוד הליגה שבקישור הוא הסוד.
4. ⚙️ **Project settings → General → Your apps → Add app → Web** (אייקון `</>`), נותנים שם וממשיכים. מקבלים אובייקט `firebaseConfig`.

**2. מגדירים סביבה**

```bash
cp .env.example .env
```

ממלאים ב־`.env` את הערכים מ־`firebaseConfig`:

| משתנה | שדה ב־firebaseConfig |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` * |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

\* אם `databaseURL` לא מופיע באובייקט, לוקחים את הכתובת מעמוד ה־Realtime Database (נראית כמו `https://<project>-default-rtdb.<region>.firebasedatabase.app`).

**3. מריצים**

```bash
npm install
npm run dev
```

נפתח ב־`http://localhost:5173`. יוצרים ליגה → לוחצים **"קישור לחברים"** בכותרת → שולחים בוואטסאפ. זהו.

## פריסה לאינטרנט (Deploy)

**אופציה א׳ — Vercel (הכי מהיר):**

1. דוחפים את התיקייה לריפו GitHub.
2. ב־[vercel.com](https://vercel.com) → **Import Project** → בוחרים את הריפו (Vite מזוהה אוטומטית).
3. ב־**Environment Variables** מוסיפים את חמשת משתני ה־`VITE_FIREBASE_*` → Deploy.

**אופציה ב׳ — Firebase Hosting:**

```bash
npm run build
npx firebase-tools login
npx firebase-tools init hosting   # public dir: dist, SPA: yes
npx firebase-tools deploy
```

## איך זה עובד

- **קישור = ליגה.** קוד הליגה יושב ב־hash של הכתובת (`https://your-app.com/#ab12cd34ef`). מי שיש לו את הקישור — בפנים. אין סיסמאות; שיטת כבוד בין חברים.
- כל שחקן בוחר את עצמו פעם אחת במכשיר (נשמר ב־localStorage). מהמסך הראשי אפשר להתחלף דרך הכפתור עם השם.
- הנקודה הירוקה בכותרת = חיבור חי. בחירות בדראפט רצות כטרנזקציות — שניים שלוחצים על אותה נבחרת באותה שנייה לא יתנגשו.
- מסך **ניהול** פתוח לכולם (שיטת כבוד): שם מזינים תוצאות מדויקות, נועלים מסלולים ומאפסים ליגה.

## הערה למי שמגיע מגרסת ה־Claude Artifact

האחסון נפרד — מקימים את הליגה פעם אחת מחדש באפליקציה (שחקנים, דראפט, הימורים).

## Live score worker

Group-stage scores are synchronized from ESPN by the Cloudflare Worker in
`worker/`. The free Worker Cron runs every minute, but ESPN is queried only once
every five minutes while a scheduled match may be active. The full schedule is
refreshed twice per day.

Production health check:

```bash
curl https://mundial-live-scores.ordahan120.workers.dev/health
```

Local validation:

```bash
npm test
npm run build
npm --prefix worker run check
```

Worker deployment requires `LEAGUE_ID`, `SYNC_TOKEN`, and `GEMINI_API_KEY` as
Cloudflare secrets. The AI consultant uses the stable `gemini-2.5-flash` model.
Do not put secret values in Git. To inspect production logs after authenticating
Wrangler:

```bash
npx --prefix worker wrangler tail mundial-live-scores
```

The existing administration score fields remain editable. Saving a score marks
that fixture as a manual override, and the `MANUAL` action can return it to
automatic ESPN updates without clearing the current score.
