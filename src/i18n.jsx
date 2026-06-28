import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const LOCALES = {
  he: { label: "עברית", short: "HE", dir: "rtl", lang: "he" },
  en: { label: "English", short: "EN", dir: "ltr", lang: "en" },
};

const DEFAULT_LOCALE = "he";
const STORAGE_KEY = "wc26locale";

const TEAM_NAMES_EN = {
  MEX: "Mexico", KOR: "South Korea", CZE: "Czechia", RSA: "South Africa",
  SUI: "Switzerland", CAN: "Canada", QAT: "Qatar", BIH: "Bosnia",
  BRA: "Brazil", MAR: "Morocco", HAI: "Haiti", SCO: "Scotland",
  USA: "United States", TUR: "Turkey", AUS: "Australia", PAR: "Paraguay",
  GER: "Germany", ECU: "Ecuador", CIV: "Ivory Coast", CUW: "Curacao",
  NED: "Netherlands", JPN: "Japan", SWE: "Sweden", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cape Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", IRQ: "Iraq", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", JOR: "Jordan",
  POR: "Portugal", COD: "DR Congo", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
};

const DICTIONARIES = {
  he: {
    appTitle: "מונדיאל 2026 · ליגת החברים",
    appTitleSuffix: "ליגת הימורים · מונדיאל 2026",
    defaultLeague: "מונדיאל 2026",
    productKicker: "ליגת הימורים · מונדיאל 2026",
    heroTitle: "מרכז השליטה של הליגה",
    heroCopy: "דראפט, הימורים, ניקוד חי וסימולציות במקום אחד.",
    liveMatches: "משחקים חיים",
    noLiveMatches: "אין משחק חי כרגע",
    syncedLive: "מסונכרן חי",
    disconnected: "מנותק",
    switchPlayer: "החלפת שחקן",
    copyLeagueLink: "העתקת קישור הליגה",
    copied: "הועתק!",
    friendsLink: "קישור לחברים",
    language: "שפה",
    firebaseMissing: "חסרה הגדרת Firebase — מלאו את קובץ ‎.env‎ לפי ההוראות ב־README והפעילו מחדש.",
    loadingLeague: "טוען את הליגה…",
    leagueMissing: "הליגה לא נמצאה — ייתכן שהקישור שגוי או שהיא אופסה.",
    openNewLeague: "פתיחת ליגה חדשה",
    statusLive: "LIVE",
    overviewLeader: "מוביל/ה",
    overviewLeaderFallback: "עדיין אין ניקוד",
    overviewPlayers: "שחקנים",
    overviewLive: "משחקים חיים",
    overviewActiveTeams: "נבחרות פעילות",
    overviewMyScore: "הניקוד שלי",
    tabTable: "טבלה",
    tabTeams: "נבחרות",
    tabBets: "ההימורים שלי",
    tabCompare: "השוואה",
    tabDraft: "דראפט",
    tabSim: "סימולציה",
    tabManage: "ניהול",
    tabRules: "חוקים",
    compareLockedTitle: "השוואת ניחושים נעולים",
    compareLockedBody: "ההשוואה נפתחת רק אחרי שניחושי העולות ננעלים.",
    compareUnlocked: "ניחושים נעולים",
    compareTitle: "השוואת ניחושים",
    compareIntro: "רואים רק שלבים שכבר ננעלו, כדי לתכנן הימורים עתידיים בלי לחשוף בחירות פתוחות.",
    compareEditOpenPicks: "עריכת הימורים פתוחים",
    compareTournamentSection: "ניחושי טורניר",
    compareMatchesSection: "הימורי משחקים נעולים",
    compareLockedOnly: "רק שלבים נעולים",
    compareTierR32: "עולות לשלב ה־32",
    compareTierR16: "עולות לשמינית הגמר",
    compareTierQf: "עולות לרבע הגמר",
    compareTierSf: "עולות לחצי הגמר",
    compareTierFin: "פיינליסטיות",
    compareTierWin: "אלופה",
    compareKoR32: "שלב ה־32",
    compareKoR16: "שמינית גמר",
    compareKoQf: "רבע גמר",
    compareKoSf: "חצי גמר",
    compareKoP3: "מקום שלישי",
    compareKoFinal: "הגמר",
    compareNoTournamentPicks: "אין עדיין ניחושים להצגה בשלב הזה.",
    compareMissingPlayers: "שחקנים ללא ניחוש בשלב הזה",
    compareNoPlayers: "אין שחקנים",
    compareGroupStage: "שלב הבתים",
    compareGroupLockedHint: "הימורי שלב הבתים יוצגו רק אחרי נעילת שלב הבתים.",
    compareKoLockedHint: "הימורי השלב הזה מוסתרים עד שהשלב ננעל.",
    compareNoLockedMatches: "אין עדיין משחקים מוכנים להצגה בשלב הנעול הזה.",
    comparePickWin: "ניצחון {team}",
    comparePickDraw: "תיקו",
    compareNoPick: "לא הימרו",
    compareUpcoming: "טרם שוחק",
    compareWinner: "עולה: {team}",
    compareWinnerPicks: "ניחוש עולה",
    compareMethodPicks: "דרך הכרעה",
    compareMethod90: "ב־90 דקות",
    compareMethodEt: "הארכה/פנדלים",
    compareNoMethod: "ללא דרך הכרעה",
    setupTitle: "פתיחת ליגה חדשה",
    setupCopy: "מוסיפים את כל החברים פעם אחת — וכל אחד שייכנס לאפליקציה יבחר מי הוא.",
    setupLeagueName: "שם הליגה",
    setupPlayers: "שחקנים",
    setupPlayerPlaceholder: "שחקן {n}",
    setupAddPlayer: "עוד שחקן",
    setupBusy: "יוצר…",
    setupSubmit: "צא לדרך",
    setupExisting: "יש לכם כבר ליגה? פתחו את הקישור ששותף בקבוצה — הוא מכיל את קוד הליגה.",
    identityTitle: "מי אתה?",
    identityCopy: "הבחירה נשמרת רק במכשיר שלך",
    lbPlayer: "שחקן",
    lbDraft: "דראפט",
    lbMatches: "משחקים",
    lbBracket: "עולות",
    lbTotal: "סה״כ",
    lbMe: "אני",
    lbDraftTeams: "הנבחרות בדראפט:",
    lbNoDraftTeams: "עוד לא שובצו נבחרות",
    lbChampionPick: "ניחוש אלופה:",
    scoreBreakdown: "פירוט נקודות",
    scoreBreakdownMeta: "משחקים: {group} נק׳ בתים · {ko} נק׳ נוקאאוט",
    byType: "לפי דרך",
    byTeam: "לפי נבחרת",
    noBreakdown: "עוד אין נקודות לפירוט",
    teamsActive: "עדיין במשחק",
    teamsEliminated: "הודחו",
    teamsTotal: "סה״כ קבוצות",
    teamsTeam: "נבחרת",
    teamsOwner: "שייכת ל",
    teamsGroup: "בית",
    teamsPoints: "ניקוד",
    teamsUnassigned: "לא שויכה",
    statusEliminated: "הודחה",
    statusFinal: "ניקוד סופי",
    statusActive: "פעילה",
  },
  en: {
    appTitle: "World Cup 2026 · Friends League",
    appTitleSuffix: "Prediction League · World Cup 2026",
    defaultLeague: "World Cup 2026",
    productKicker: "Prediction League · World Cup 2026",
    heroTitle: "League Command Center",
    heroCopy: "Draft, picks, live scoring and scenario planning in one match-day workspace.",
    liveMatches: "Live matches",
    noLiveMatches: "No live match right now",
    syncedLive: "Live sync on",
    disconnected: "Disconnected",
    switchPlayer: "Switch player",
    copyLeagueLink: "Copy league link",
    copied: "Copied!",
    friendsLink: "Invite link",
    language: "Language",
    firebaseMissing: "Firebase is not configured. Fill .env from the README and restart the app.",
    loadingLeague: "Loading league…",
    leagueMissing: "League not found. The link may be wrong or the league was reset.",
    openNewLeague: "Open a new league",
    statusLive: "LIVE",
    overviewLeader: "Leader",
    overviewLeaderFallback: "No points yet",
    overviewPlayers: "Players",
    overviewLive: "Live matches",
    overviewActiveTeams: "Active teams",
    overviewMyScore: "My score",
    tabTable: "Table",
    tabTeams: "Teams",
    tabBets: "My picks",
    tabCompare: "Compare",
    tabDraft: "Draft",
    tabSim: "Simulator",
    tabManage: "Manage",
    tabRules: "Rules",
    compareLockedTitle: "Locked picks comparison",
    compareLockedBody: "The comparison view unlocks after tournament picks are locked.",
    compareUnlocked: "Locked picks",
    compareTitle: "Picks comparison",
    compareIntro: "Only locked stages are visible, so players can plan future picks without exposing open choices.",
    compareEditOpenPicks: "Edit open picks",
    compareTournamentSection: "Tournament picks",
    compareMatchesSection: "Locked match picks",
    compareLockedOnly: "Locked stages only",
    compareTierR32: "Round of 32 qualifiers",
    compareTierR16: "Round of 16 qualifiers",
    compareTierQf: "Quarter-finalists",
    compareTierSf: "Semi-finalists",
    compareTierFin: "Finalists",
    compareTierWin: "Champion",
    compareKoR32: "Round of 32",
    compareKoR16: "Round of 16",
    compareKoQf: "Quarter-finals",
    compareKoSf: "Semi-finals",
    compareKoP3: "Third place",
    compareKoFinal: "Final",
    compareNoTournamentPicks: "No picks to show for this stage yet.",
    compareMissingPlayers: "Players with no pick in this stage",
    compareNoPlayers: "No players",
    compareGroupStage: "Group stage",
    compareGroupLockedHint: "Group-stage match picks appear only after the group stage is locked.",
    compareKoLockedHint: "This round's match picks stay hidden until the round is locked.",
    compareNoLockedMatches: "No matches are ready to show in this locked round yet.",
    comparePickWin: "{team} win",
    comparePickDraw: "Draw",
    compareNoPick: "No pick",
    compareUpcoming: "Not played yet",
    compareWinner: "Winner: {team}",
    compareWinnerPicks: "Winner picks",
    compareMethodPicks: "Decision method",
    compareMethod90: "In 90 minutes",
    compareMethodEt: "Extra time / penalties",
    compareNoMethod: "No method",
    setupTitle: "Create a new league",
    setupCopy: "Add the full group once. Each friend picks their identity when they open the app.",
    setupLeagueName: "League name",
    setupPlayers: "Players",
    setupPlayerPlaceholder: "Player {n}",
    setupAddPlayer: "Add player",
    setupBusy: "Creating…",
    setupSubmit: "Start league",
    setupExisting: "Already have a league? Open the shared link from the group chat. It contains the league code.",
    identityTitle: "Who are you?",
    identityCopy: "This choice is saved only on this device",
    lbPlayer: "Player",
    lbDraft: "Draft",
    lbMatches: "Picks",
    lbBracket: "Bracket",
    lbTotal: "Total",
    lbMe: "Me",
    lbDraftTeams: "Drafted teams:",
    lbNoDraftTeams: "No teams assigned yet",
    lbChampionPick: "Champion pick:",
    scoreBreakdown: "Point breakdown",
    scoreBreakdownMeta: "Picks: {group} group · {ko} knockout",
    byType: "By source",
    byTeam: "By team",
    noBreakdown: "No points to break down yet",
    teamsActive: "Still alive",
    teamsEliminated: "Eliminated",
    teamsTotal: "Total teams",
    teamsTeam: "Team",
    teamsOwner: "Owner",
    teamsGroup: "Group",
    teamsPoints: "Points",
    teamsUnassigned: "Unassigned",
    statusEliminated: "Out",
    statusFinal: "Final points",
    statusActive: "Active",
  },
};

const LocaleContext = createContext(null);

function normalizeLocale(value) {
  return LOCALES[value] ? value : DEFAULT_LOCALE;
}

function readInitialLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const params = new URLSearchParams(window.location.search);
  return normalizeLocale(params.get("lang") || window.localStorage.getItem(STORAGE_KEY));
}

function formatMessage(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = useCallback((nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, normalized);
    const url = new URL(window.location.href);
    if (normalized === DEFAULT_LOCALE) url.searchParams.delete("lang");
    else url.searchParams.set("lang", normalized);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const info = LOCALES[locale];
    document.documentElement.lang = info.lang;
    document.documentElement.dir = info.dir;
  }, [locale]);

  const value = useMemo(() => {
    const dictionary = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
    const fallback = DICTIONARIES[DEFAULT_LOCALE];
    return {
      locale,
      dir: LOCALES[locale].dir,
      lang: LOCALES[locale].lang,
      locales: LOCALES,
      setLocale,
      t(key, params) {
        return formatMessage(dictionary[key] || fallback[key] || key, params);
      },
      teamName(code, fallbackName) {
        return locale === "en" ? TEAM_NAMES_EN[code] || fallbackName || code : fallbackName || code;
      },
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
