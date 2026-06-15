/* Mundial 2026 League — UI kit screens. Loaded as a Babel script.
   Reads design-system primitives from the compiled bundle namespace and
   exports screen components to window for index.html to compose. */

const DS = window.Mundial2026LeagueDesignSystem_4cb07a;
const { Button, Pill, Card, Badge, PlayerDot, Flag, ConnectionDot, TextField, ScoreInput, TabBar, Section } = DS;
const { TEAMS } = DS;

/* ---- Lucide icon helper ---- */
function Icon({ name, size = 14, color = "currentColor" }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.lucide || !window.lucide[name]) return;
    ref.current.innerHTML = "";
    const el = window.lucide.createElement(window.lucide[name]);
    el.setAttribute("width", size);
    el.setAttribute("height", size);
    el.setAttribute("stroke", color);
    ref.current.appendChild(el);
  }, [name, size, color]);
  return <span ref={ref} style={{ display: "inline-flex", alignItems: "center" }} />;
}

/* ---- Header ---- */
function Header({ name, meName, onSwitch, connected }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div>
      <div style={{ display: "flex", height: 4 }}>
        <div style={{ flex: 1, background: "var(--host-1)" }} />
        <div style={{ flex: 1, background: "var(--host-2)" }} />
        <div style={{ flex: 1, background: "var(--host-3)" }} />
      </div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 900, letterSpacing: "-.02em", color: "var(--text-heading)" }}>
            {name} <span style={{ fontSize: 15 }}>🇺🇸🇨🇦🇲🇽</span>
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-meta)" }}>ליגת הימורים · מונדיאל 2026</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {meName && (
            <button onClick={onSwitch} className="ghost-pill">
              <Icon name="Users" size={12} /> {meName}
            </button>
          )}
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }} className="ghost-pill">
            {copied ? <Icon name="Check" size={12} color="var(--emerald-400)" /> : <Icon name="Link2" size={12} />}
            {copied ? "הועתק!" : "קישור לחברים"}
          </button>
          <ConnectionDot connected={connected} pulse={connected} />
        </div>
      </header>
    </div>
  );
}

/* ---- Setup ---- */
function SetupScreen({ onCreate }) {
  const [leagueName, setLeagueName] = React.useState("ליגת החברים");
  const [names, setNames] = React.useState(["דניאל", "מאיה", "יוסי", "נועה"]);
  const ok = leagueName.trim() && names.filter((n) => n.trim()).length >= 2;
  return (
    <div style={{ maxWidth: "var(--container-form)", margin: "0 auto", padding: "32px 0" }}>
      <Card padded style={{ padding: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--text-strong)" }}>פתיחת ליגה חדשה</h2>
        <p style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          מוסיפים את כל החברים פעם אחת — וכל אחד שייכנס לאפליקציה יבחר מי הוא.
        </p>
        <div style={{ marginBottom: 16 }}>
          <TextField label="שם הליגה" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-meta)", marginBottom: 4 }}>שחקנים</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {names.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextField value={n} placeholder={"שחקן " + (i + 1)}
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
              </div>
              {names.length > 2 && (
                <button className="icon-btn" onClick={() => setNames(names.filter((_, j) => j !== i))}>
                  <Icon name="Trash2" size={16} color="var(--slate-600)" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="add-link" onClick={() => setNames([...names, ""])}>
          <Icon name="Plus" size={14} /> עוד שחקן
        </button>
        <div style={{ marginTop: 20 }}>
          <Button tone="sky" block disabled={!ok} onClick={() => onCreate(leagueName, names)}>צא לדרך ⚽</Button>
        </div>
        <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--text-meta)" }}>
          יש לכם כבר ליגה? פתחו את הקישור ששותף בקבוצה.
        </p>
      </Card>
    </div>
  );
}

/* ---- Identity ---- */
function IdentityScreen({ players, onPick }) {
  return (
    <div style={{ maxWidth: "var(--container-form)", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--text-strong)" }}>מי אתה?</h2>
      <p style={{ margin: "0 0 20px", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>הבחירה נשמרת רק במכשיר שלך</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p) => (
          <button key={p.id} className="identity-btn" onClick={() => onPick(p.id)}>
            <PlayerDot name={p.name} idx={p.idx} /> {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Leaderboard ---- */
function Leaderboard({ rows, meId }) {
  const [open, setOpen] = React.useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,4fr) repeat(4, 2fr)", padding: "0 12px", fontSize: "var(--text-xs)", color: "var(--text-meta)" }}>
        <div>שחקן</div>
        <div style={{ textAlign: "center" }}>דראפט</div>
        <div style={{ textAlign: "center" }}>משחקים</div>
        <div style={{ textAlign: "center" }}>עולות</div>
        <div style={{ textAlign: "center" }}>סה״כ</div>
      </div>
      {rows.map((r, rank) => {
        const isLeader = rank === 0;
        const isMe = r.p.id === meId;
        const isOpen = open === r.p.id;
        return (
          <Card key={r.p.id} leader={isLeader} padded={false}>
            <button onClick={() => setOpen(isOpen ? null : r.p.id)}
              style={{ display: "grid", width: "100%", gridTemplateColumns: "minmax(0,4fr) repeat(4, 2fr)", alignItems: "center", padding: "12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                <span style={{ width: 16, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: isLeader ? "var(--state-leader-text)" : "var(--text-meta)" }}>{rank + 1}</span>
                <PlayerDot name={r.p.name} idx={r.p.idx} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>{r.p.name}</span>
                {isMe && <Badge tone="sky">אני</Badge>}
              </div>
              <Num v={r.draft} />
              <Num v={r.matches} />
              <Num v={r.bracket} />
              <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", fontWeight: 900, color: isLeader ? "var(--state-leader-text)" : "var(--text-strong)" }}>{r.total}</div>
            </button>
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", padding: 12, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                פירוט נקודות — דראפט {r.draft} · הימורי משחקים {r.matches} · ניחושי עולות {r.bracket}.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
function Num({ v }) {
  return <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{v}</div>;
}

/* ---- Bets ---- */
function BetsScreen({ group, onBet }) {
  const labels = { "1": "1", X: "X", "2": "2" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Section title={"בית " + group.key} badge={group.fixtures.length} sub="הימורי 1/X/2" defaultOpen>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {group.fixtures.map((f) => {
            const done = !!f.result;
            return (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", justifyContent: "flex-start", gap: 6, fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
                  <Flag code={f.t1} /> <span style={{ whiteSpace: "nowrap" }}>{TEAMS[f.t1][0]}</span>
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {["1", "X", "2"].map((opt) => {
                    const sel = f.bet === opt;
                    const hit = done && f.result && resultOutcome(f.result) === opt;
                    return (
                      <Pill key={opt} selected={sel} tone={done ? "emerald" : "sky"}
                        mark={done ? (sel ? (hit ? "hit" : "miss") : null) : null}
                        onClick={() => !done && onBet(f.id, opt)} style={{ width: 38 }}>
                        {labels[opt]}
                      </Pill>
                    );
                  })}
                </div>
                <span style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
                  <span style={{ whiteSpace: "nowrap" }}>{TEAMS[f.t2][0]}</span> <Flag code={f.t2} />
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
function resultOutcome(r) {
  const m = /^(\d+)-(\d+)$/.exec(r);
  if (!m) return null;
  return +m[1] > +m[2] ? "1" : +m[1] < +m[2] ? "2" : "X";
}

/* ---- Draft ---- */
function DraftScreen({ draft, players, onPick }) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const current = byId[draft.current];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="Shuffle" size={16} color="var(--sky-400)" />
          <span style={{ fontWeight: 700, color: "var(--text-strong)", fontSize: "var(--text-sm)" }}>תור הבחירה:</span>
          <PlayerDot name={current.name} idx={current.idx} size={18} />
          <span style={{ fontWeight: 700, color: "var(--sky-300)", fontSize: "var(--text-sm)" }}>{current.name}</span>
          <span style={{ marginInlineStart: "auto", fontSize: "var(--text-xs)", color: "var(--text-meta)" }}>נותרו {draft.pool.length} נבחרות</span>
        </div>
      </Card>

      <Section title="הנבחרות הזמינות" badge={draft.pool.length} defaultOpen>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {draft.pool.map((code) => (
            <Pill key={code} icon={<Flag code={code} />} onClick={() => onPick(code)}>{TEAMS[code][0]}</Pill>
          ))}
        </div>
      </Section>

      <Section title="מי בחר מה" badge={players.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {players.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <PlayerDot name={p.name} idx={p.idx} size={18} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-strong)", width: 56 }}>{p.name}</span>
              {(draft.owned[p.id] || []).map((c) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", color: "var(--text-body)" }}>
                  <Flag code={c} /> {TEAMS[c][0]}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, { Icon, Header, SetupScreen, IdentityScreen, Leaderboard, BetsScreen, DraftScreen });
