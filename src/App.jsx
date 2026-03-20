import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

function useWinW() {
  const [w, setW] = useState(800);
  useEffect(() => {
    setW(window.innerWidth);
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

const MLABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const SKEY = "church_energy_v11";
const YCOL = { "2023":"#378ADD","2024":"#1D9E75","2025":"#E24B4A","2026":"#BA7517","2027":"#7F77DD" };

// ★ Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzY0CeMquiKZ3uF9qfvL188fMmrE61vA-P-Ke29z2w3uEoVEZMGv8ek07gQtVaB9Fix/exec";

const SHEET_CONFIG = [
  { name: "기본전기",      fields: ["e1_usage","e1_cost"] },
  { name: "냉난방전기",    fields: ["e2_usage","e2_cost"] },
  { name: "5층주방가스",   fields: ["gas1_usage","gas1_heat","gas1_cost"] },
  { name: "옥상냉난방가스", fields: ["gas2_usage","gas2_heat","gas2_cost"] },
];

const FIELD_TO_SHEET = {};
SHEET_CONFIG.forEach(({ name, fields }) => fields.forEach(f => { FIELD_TO_SHEET[f] = name; }));

function rowsToStored(rows, fields) {
  const out = {};
  rows.forEach(row => {
    const y = String(row["연도"]);
    const m = String(row["월"]).padStart(2, "0");
    const k = y + "-" + m;
    out[k] = out[k] || {};
    fields.forEach(f => { if (row[f] !== undefined && row[f] !== "") out[k][f] = Number(row[f]); });
  });
  return out;
}

async function loadFromSheets() {
  const merged = {};
  await Promise.all(SHEET_CONFIG.map(async ({ name, fields }) => {
    try {
      const res = await fetch(SCRIPT_URL + "?sheet=" + encodeURIComponent(name));
      const json = await res.json();
      if (json.success && json.data) {
        const partial = rowsToStored(json.data, fields);
        Object.keys(partial).forEach(k => { merged[k] = Object.assign(merged[k] || {}, partial[k]); });
      }
    } catch (e) { console.error("시트 로딩 실패:", name, e); }
  }));
  return merged;
}

async function saveToSheet(sheetName, year, month, data) {
  const payload = { 연도: year, 월: month, ...data };
  const url = SCRIPT_URL + "?action=write&sheet=" + encodeURIComponent(sheetName) + "&data=" + encodeURIComponent(JSON.stringify(payload));
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) { return { error: e.message }; }
}

const EBASE = {"2024-02":{"e1_usage":3143,"e1_cost":721160},"2024-03":{"e1_usage":2856,"e1_cost":677310},"2024-04":{"e1_usage":1725,"e1_cost":383550},"2024-05":{"e1_usage":1489,"e1_cost":355130},"2024-06":{"e1_usage":1664,"e1_cost":450320},"2024-07":{"e1_usage":1781,"e1_cost":467730},"2024-08":{"e1_usage":1969,"e1_cost":498890},"2024-09":{"e1_usage":1650,"e1_cost":370380},"2024-10":{"e1_usage":1497,"e1_cost":352040},"2024-11":{"e1_usage":2210,"e1_cost":505300},"2024-12":{"e1_usage":3615,"e1_cost":908600},"2025-01":{"e1_usage":3077,"e1_cost":879900},"2025-02":{"e1_usage":3421,"e1_cost":914250},"2025-03":{"e1_usage":2960,"e1_cost":597150},"2025-04":{"e1_usage":2177,"e1_cost":433550},"2025-05":{"e1_usage":1754,"e1_cost":382840},"2025-06":{"e1_usage":1921,"e1_cost":490930},"2025-07":{"e1_usage":2245,"e1_cost":542230},"2025-09":{"e1_usage":1678,"e1_cost":372080,"e2_usage":63,"e2_cost":111640},"2025-10":{"e1_usage":1803,"e1_cost":389500,"e2_usage":12,"e2_cost":106530},"2025-11":{"e1_usage":2514,"e1_cost":603210,"e2_usage":44,"e2_cost":110720},"2025-12":{"e1_usage":3834,"e1_cost":1044050},"2026-01":{"e1_usage":3891,"e1_cost":1069940,"e2_usage":224,"e2_cost":137700},"2026-02":{"e2_usage":131,"e2_cost":123760}};
const GBASE = {"2022-12":{"gas1_usage":11,"gas1_heat":470,"gas1_cost":12360,"gas2_usage":1923,"gas2_heat":82319,"gas2_cost":3240920},"2023-01":{"gas1_usage":15,"gas1_heat":646,"gas1_cost":16130,"gas2_usage":1220,"gas2_heat":52547,"gas2_cost":1955670},"2023-02":{"gas1_usage":24,"gas1_heat":1031,"gas1_cost":24420,"gas2_usage":1003,"gas2_heat":43122,"gas2_cost":1584280},"2023-03":{"gas1_usage":19,"gas1_heat":811,"gas1_cost":19670,"gas2_usage":109,"gas2_heat":4652,"gas2_cost":181010},"2023-04":{"gas1_usage":20,"gas1_heat":855,"gas1_cost":20600,"gas2_usage":213,"gas2_heat":9111,"gas2_cost":267970},"2023-05":{"gas1_usage":12,"gas1_heat":513,"gas1_cost":13450,"gas2_usage":41,"gas2_heat":1754,"gas2_cost":30910},"2023-06":{"gas1_usage":12,"gas1_heat":513,"gas1_cost":13730,"gas2_usage":302,"gas2_heat":12915,"gas2_cost":210290},"2023-07":{"gas1_usage":13,"gas1_heat":555,"gas1_cost":14680,"gas2_usage":848,"gas2_heat":36248,"gas2_cost":609160},"2023-08":{"gas1_usage":13,"gas1_heat":553,"gas1_cost":14640,"gas2_usage":750,"gas2_heat":31954,"gas2_cost":505870},"2023-09":{"gas1_usage":11,"gas1_heat":466,"gas1_cost":12680,"gas2_usage":394,"gas2_heat":16703,"gas2_cost":263420},"2023-10":{"gas1_usage":15,"gas1_heat":638,"gas1_cost":16540,"gas2_usage":2,"gas2_heat":85,"gas2_cost":4310},"2023-11":{"gas1_usage":22,"gas1_heat":941,"gas1_cost":23330,"gas2_usage":339,"gas2_heat":14505,"gas2_cost":330120},"2023-12":{"gas1_usage":19,"gas1_heat":816,"gas1_cost":20690,"gas2_usage":973,"gas2_heat":41791,"gas2_cost":1051490},"2024-01":{"gas1_usage":20,"gas1_heat":858,"gas1_cost":21660,"gas2_usage":952,"gas2_heat":40879,"gas2_cost":1116840},"2024-02":{"gas1_usage":21,"gas1_heat":900,"gas1_cost":22590,"gas2_usage":555,"gas2_heat":23786,"gas2_cost":598700},"2024-03":{"gas1_usage":24,"gas1_heat":1029,"gas1_cost":25520,"gas2_usage":496,"gas2_heat":21276,"gas2_cost":547770},"2024-04":{"gas1_usage":17,"gas1_heat":728,"gas1_cost":18560,"gas2_usage":8,"gas2_heat":342,"gas2_cost":10080},"2024-05":{"gas1_usage":17,"gas1_heat":728,"gas1_cost":18560,"gas2_usage":34,"gas2_heat":1450,"gas2_cost":24320},"2024-06":{"gas1_usage":16,"gas1_heat":681,"gas1_cost":17500,"gas2_usage":519,"gas2_heat":22114,"gas2_cost":328660},"2024-07":{"gas1_usage":13,"gas1_heat":554,"gas1_cost":14740,"gas2_usage":791,"gas2_heat":33740,"gas2_cost":521700},"2024-08":{"gas1_usage":11,"gas1_heat":468,"gas1_cost":13490,"gas2_usage":1010,"gas2_heat":43058,"gas2_cost":687970},"2024-09":{"gas1_usage":11,"gas1_heat":467,"gas1_cost":13450,"gas2_usage":615,"gas2_heat":26139,"gas2_cost":422150},"2024-10":{"gas1_usage":14,"gas1_heat":596,"gas1_cost":16540,"gas2_usage":11,"gas2_heat":468,"gas2_cost":13690},"2024-11":{"gas1_usage":25,"gas1_heat":1063,"gas1_cost":27750,"gas2_usage":66,"gas2_heat":2808,"gas2_cost":69930},"2024-12":{"gas1_usage":19,"gas1_heat":808,"gas1_cost":21620,"gas2_usage":383,"gas2_heat":16287,"gas2_cost":432650},"2025-01":{"gas1_usage":29,"gas1_heat":1239,"gas1_cost":31970,"gas2_usage":523,"gas2_heat":22356,"gas2_cost":580330},"2025-02":{"gas1_usage":25,"gas1_heat":1064,"gas1_cost":27770,"gas2_usage":459,"gas2_heat":19543,"gas2_cost":501330},"2025-03":{"gas1_usage":18,"gas1_heat":765,"gas1_cost":20600,"gas2_usage":177,"gas2_heat":7529,"gas2_cost":190030},"2025-04":{"gas1_usage":21,"gas1_heat":888,"gas1_cost":23550,"gas2_usage":28,"gas2_heat":1184,"gas2_cost":31610},"2025-05":{"gas1_usage":22,"gas1_heat":932,"gas1_cost":24600,"gas2_usage":28,"gas2_heat":1186,"gas2_cost":20490},"2025-06":{"gas1_usage":13,"gas1_heat":548,"gas1_cost":15390,"gas2_usage":422,"gas2_heat":17803,"gas2_cost":269390},"2025-07":{"gas1_usage":6,"gas1_heat":253,"gas1_cost":8340,"gas2_usage":642,"gas2_heat":27137,"gas2_cost":389240},"2025-08":{"gas1_usage":8,"gas1_heat":337,"gas1_cost":10370,"gas2_usage":326,"gas2_heat":13766,"gas2_cost":196020},"2025-09":{"gas1_usage":12,"gas1_heat":507,"gas1_cost":14440,"gas2_usage":165,"gas2_heat":6973,"gas2_cost":106090},"2025-10":{"gas1_usage":13,"gas1_heat":549,"gas1_cost":15460,"gas2_usage":25,"gas2_heat":1056,"gas2_cost":24610},"2025-11":{"gas1_usage":20,"gas1_heat":845,"gas1_cost":22570,"gas2_usage":77,"gas2_heat":3254,"gas2_cost":67210},"2025-12":{"gas1_usage":18,"gas1_heat":761,"gas1_cost":20550,"gas2_usage":421,"gas2_heat":17806,"gas2_cost":387889},"2026-01":{"gas1_usage":25,"gas1_heat":1058,"gas1_cost":27690,"gas2_usage":422,"gas2_heat":17859,"gas2_cost":397390}};

const fmt = (n) => n ? Number(n).toLocaleString("ko-KR") : "-";
const fmtP = (v) => v == null ? null : (v > 0 ? "+" + v.toFixed(1) + "%" : v.toFixed(1) + "%");
const pct = (c, p) => (!p || !c) ? null : ((c - p) / p) * 100;
const fmtW = (v) => v >= 10000 ? (v / 10000).toFixed(0) + "만" : String(v);
const mkey = (y, m) => y + "-" + String(m).padStart(2, "0");

function lastM(data, y, f) {
  for (let m = 12; m >= 1; m--) {
    const v = (data[mkey(y, m)] || {})[f];
    if (v && v > 0) return m;
  }
  return 0;
}
function sumTo(data, y, f, max) {
  let t = 0;
  for (let m = 1; m <= max; m++) { t += (data[mkey(y, m)] || {})[f] || 0; }
  return t;
}
function merge(stored) {
  const out = {};
  const ks = new Set([...Object.keys(EBASE), ...Object.keys(GBASE), ...Object.keys(stored)]);
  ks.forEach((k) => { out[k] = Object.assign({}, EBASE[k] || {}, GBASE[k] || {}, stored[k] || {}); });
  return out;
}

function Badge({ val, prev }) {
  const c = pct(val, prev);
  if (c == null) return null;
  return (
    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4,
      background: c > 0 ? "#FCEBEB" : "#EAF3DE",
      color: c > 0 ? "#A32D2D" : "#3B6D11", fontWeight: 500 }}>
      {fmtP(c)}
    </span>
  );
}

function Card({ label, val, prev, unit, accent, mob, py }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 10,
      padding: mob ? "0.75rem" : "1rem", borderLeft: accent ? "3px solid " + accent : "none" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: mob ? 15 : 17, fontWeight: 500, marginBottom: 5 }}>
        {fmt(val)}<span style={{ fontSize: 10, marginLeft: 3, color: "var(--color-text-tertiary)" }}>{unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {prev > 0 && <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{py}년: {fmt(prev)}{unit}</span>}
        <Badge val={val} prev={prev} />
      </div>
    </div>
  );
}

function BarChart2({ title, rows, mob, cy, py, cc }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem", marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "0.75rem", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500 }}>{title}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: cc, display: "inline-block" }} />{cy}년
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#D3D1C7", display: "inline-block" }} />{py}년
          </span>
        </div>
      </div>
      <div style={{ height: mob ? 160 : 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} barSize={mob ? 12 : 18} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={fmtW} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v, n) => [Number(v).toLocaleString("ko-KR") + "원", n === "curr" ? cy + "년" : py + "년"]}
              contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            <Bar dataKey="curr" fill={cc} radius={[2, 2, 0, 0]} name={cy + "년"} />
            <Bar dataKey="prev" fill="#D3D1C7" radius={[2, 2, 0, 0]} name={py + "년"} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function YearLine({ title, rows, years, mob, unit }) {
  const active = years.filter((y) => rows.some((r) => r[y] != null));
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem", marginBottom: "0.875rem" }}>
      <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ display: "flex", gap: mob ? 8 : 14, flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {active.map((y) => (
          <span key={y} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <svg width="20" height="8" viewBox="0 0 20 8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={YCOL[y] || "#888"} strokeWidth="2" />
              <circle cx="10" cy="4" r="2" fill={YCOL[y] || "#888"} />
            </svg>
            {y}년
          </span>
        ))}
      </div>
      <div style={{ height: mob ? 180 : 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={fmtW} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v, n) => [Number(v).toLocaleString("ko-KR") + unit, n + "년"]}
              contentStyle={{ fontSize: 11, borderRadius: 6 }} itemSorter={(i) => -(i.value || 0)} />
            {active.map((y) => (
              <Line key={y} type="monotone" dataKey={y} stroke={YCOL[y] || "#888"}
                strokeWidth={2} dot={{ r: 2, fill: YCOL[y] || "#888" }} activeDot={{ r: 4 }} connectNulls name={y} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UsageLine({ title, rows, mob, cy, py, unit, cc, pc, l1, l2, clicked, onSet, onClear }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem", marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "0.5rem", flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500 }}>{title}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <svg width="20" height="8" viewBox="0 0 20 8"><line x1="0" y1="4" x2="20" y2="4" stroke={cc} strokeWidth="2.5" /></svg>
            {cy}년
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <svg width="20" height="8" viewBox="0 0 20 8"><line x1="0" y1="4" x2="20" y2="4" stroke={pc} strokeWidth="2" strokeDasharray="4 2" /></svg>
            {py}년
          </span>
        </div>
      </div>
      {clicked && (
        <div style={{ marginBottom: "0.75rem", padding: "8px 12px", background: "var(--color-background-secondary)",
          borderRadius: 8, fontSize: 12, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 500 }}>{clicked.name} 사용량</span>
          <span style={{ color: cc }}>{cy}년: <strong>{(clicked.curr || 0).toLocaleString("ko-KR")} {unit}</strong>
            {l1 && <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginLeft: 4 }}>({l1} {(clicked.a || 0).toLocaleString()} + {l2} {(clicked.b || 0).toLocaleString()})</span>}
          </span>
          <span style={{ color: pc }}>{py}년: <strong>{(clicked.prev || 0).toLocaleString("ko-KR")} {unit}</strong></span>
          <button onClick={onClear} style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}>x</button>
        </div>
      )}
      <div style={{ height: mob ? 160 : 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} onClick={(e) => { if (e && e.activePayload && e.activePayload[0]) onSet(e.activePayload[0].payload); }} style={{ cursor: "pointer" }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(v, n) => [Number(v).toLocaleString("ko-KR") + unit, n === "curr" ? cy + "년" : py + "년"]}
              contentStyle={{ fontSize: 11, borderRadius: 6 }} />
            <Line type="monotone" dataKey="curr" stroke={cc} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls name="curr" />
            <Line type="monotone" dataKey="prev" stroke={pc} strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} connectNulls name="prev" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MTable({ year, data, c1, c2, lbs, mob }) {
  const lm = Math.max(...c1.fs.map((f) => lastM(data, year, f)), ...c2.fs.map((f) => lastM(data, year, f)));
  const partial = lm > 0 && lm < 12;
  const upTo = lm || 12;
  const s1 = c1.fs.reduce((s, f) => s + sumTo(data, year, f, upTo), 0);
  const s2 = c2.fs.reduce((s, f) => s + sumTo(data, year, f, upTo), 0);
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem", marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
        <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500 }}>{year}년 월별 상세</div>
        {mob && <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>가로 스크롤</div>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 460 }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ padding: "5px 7px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: 500, verticalAlign: "middle", borderBottom: "0.5px solid var(--color-border-secondary)" }}>월</th>
              <th colSpan={c1.fs.length} style={{ padding: "4px 7px", textAlign: "center", background: c1.bg, color: c1.tc, fontWeight: 500, fontSize: 11, borderLeft: "2px solid " + c1.bd }}>{lbs[0]}</th>
              <th colSpan={c2.fs.length} style={{ padding: "4px 7px", textAlign: "center", background: c2.bg, color: c2.tc, fontWeight: 500, fontSize: 11, borderLeft: "2px solid " + c2.bd }}>{lbs[1]}</th>
              <th rowSpan={2} style={{ padding: "5px 7px", textAlign: "right", fontWeight: 500, verticalAlign: "middle", borderLeft: "1px solid var(--color-border-secondary)", borderBottom: "0.5px solid var(--color-border-secondary)" }}>합계</th>
            </tr>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
              {c1.sl.map((l, i) => (<th key={i} style={{ padding: "4px 7px", textAlign: "right", color: c1.tc, fontWeight: 400, fontSize: 10, background: c1.bg, borderLeft: i === 0 ? "2px solid " + c1.bd : "none" }}>{l}</th>))}
              {c2.sl.map((l, i) => (<th key={i} style={{ padding: "4px 7px", textAlign: "right", color: c2.tc, fontWeight: 400, fontSize: 10, background: c2.bg, borderLeft: i === 0 ? "2px solid " + c2.bd : "none" }}>{l}</th>))}
            </tr>
          </thead>
          <tbody>
            {MLABELS.map((m, mi) => {
              const d = data[mkey(year, mi + 1)] || {};
              const v1 = c1.fs.map((f) => d[f] || 0);
              const v2 = c2.fs.map((f) => d[f] || 0);
              const tot = v1.reduce((s, v) => s + v, 0) + v2.reduce((s, v) => s + v, 0);
              const isLast = mi + 1 === lm && partial;
              return (
                <tr key={mi} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "5px 7px", fontWeight: 500 }}>
                    {m}{isLast && <span style={{ fontSize: 9, marginLeft: 3, color: "#1D9E75", padding: "1px 4px", background: "#E1F5EE", borderRadius: 3 }}>최신</span>}
                  </td>
                  {v1.map((v, i) => (<td key={i} style={{ padding: "5px 7px", textAlign: "right", color: c1.tc, background: c1.cb, fontWeight: i === v1.length - 1 ? 500 : 400, borderLeft: i === 0 ? "2px solid " + c1.bd : "none" }}>{v ? fmt(v) : "-"}</td>))}
                  {v2.map((v, i) => (<td key={i} style={{ padding: "5px 7px", textAlign: "right", color: c2.tc, background: c2.cb, fontWeight: i === v2.length - 1 ? 500 : 400, borderLeft: i === 0 ? "2px solid " + c2.bd : "none" }}>{v ? fmt(v) : "-"}</td>))}
                  <td style={{ padding: "5px 7px", textAlign: "right", fontWeight: 500, borderLeft: "1px solid var(--color-border-secondary)" }}>{tot > 0 ? fmt(tot) : "-"}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "1px solid var(--color-border-secondary)", fontWeight: 500, background: "var(--color-background-secondary)" }}>
              <td style={{ padding: "5px 7px", fontSize: 11, color: "var(--color-text-secondary)" }}>{partial ? "1~" + lm + "월" : "연간"} 합계</td>
              {c1.fs.map((f, i) => (<td key={i} style={{ padding: "5px 7px", textAlign: "right", color: c1.bd, borderLeft: i === 0 ? "2px solid " + c1.bd : "none" }}>{fmt(sumTo(data, year, f, upTo))}</td>))}
              {c2.fs.map((f, i) => (<td key={i} style={{ padding: "5px 7px", textAlign: "right", color: c2.bd, borderLeft: i === 0 ? "2px solid " + c2.bd : "none" }}>{fmt(sumTo(data, year, f, upTo))}</td>))}
              <td style={{ padding: "5px 7px", textAlign: "right", borderLeft: "1px solid var(--color-border-secondary)" }}>{fmt(s1 + s2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabMain({ data, selYear, prevYear, allYears, mob, lmAll, upTo, isPartial }) {
  const cur = { eC: sumTo(data, selYear, "e1_cost", upTo) + sumTo(data, selYear, "e2_cost", upTo), gC: sumTo(data, selYear, "gas1_cost", upTo) + sumTo(data, selYear, "gas2_cost", upTo), eU: sumTo(data, selYear, "e1_usage", upTo) + sumTo(data, selYear, "e2_usage", upTo) };
  const pre = { eC: sumTo(data, prevYear, "e1_cost", upTo) + sumTo(data, prevYear, "e2_cost", upTo), gC: sumTo(data, prevYear, "gas1_cost", upTo) + sumTo(data, prevYear, "gas2_cost", upTo), eU: sumTo(data, prevYear, "e1_usage", upTo) + sumTo(data, prevYear, "e2_usage", upTo) };
  const bdRows = MLABELS.map((m, i) => {
    const d = data[mkey(selYear, i + 1)] || {};
    const pd = data[mkey(prevYear, i + 1)] || {};
    return { name: m, elecCurr: ((d.e1_cost || 0) + (d.e2_cost || 0)) || null, elecPrev: ((pd.e1_cost || 0) + (pd.e2_cost || 0)) || null, gasCurr: ((d.gas1_cost || 0) + (d.gas2_cost || 0)) || null, gasPrev: ((pd.gas1_cost || 0) + (pd.gas2_cost || 0)) || null };
  });
  const sfx = isPartial ? " (1~" + upTo + "월)" : "";
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1rem" }}>
        <div style={{ gridColumn: mob ? "1/3" : "auto", background: "var(--color-background-secondary)", borderRadius: 10, padding: mob ? "0.75rem" : "1rem", borderLeft: "3px solid #534AB7" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 5 }}>{"총 에너지비용" + sfx}</div>
          <div style={{ fontSize: mob ? 18 : 22, fontWeight: 500, marginBottom: 5 }}>{fmt(cur.eC + cur.gC)}<span style={{ fontSize: 10, marginLeft: 3, color: "var(--color-text-tertiary)" }}>원</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{prevYear}년: {fmt(pre.eC + pre.gC)}원</span>
            <Badge val={cur.eC + cur.gC} prev={pre.eC + pre.gC} />
          </div>
        </div>
        <Card label={"전기요금" + sfx} val={cur.eC} prev={pre.eC} unit="원" mob={mob} py={prevYear} />
        <Card label={"가스요금" + sfx} val={cur.gC} prev={pre.gC} unit="원" mob={mob} py={prevYear} />
        <Card label="전기사용량" val={cur.eU} prev={pre.eU} unit="kWh" mob={mob} py={prevYear} />
      </div>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem", marginBottom: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500 }}>{"월별 에너지요금 현황 (" + selYear + "년 vs " + prevYear + "년)"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["#378ADD","전기 "+selYear+"년"],["#B5D4F4","전기 "+prevYear+"년"],["#1D9E75","가스 "+selYear+"년"],["#9FE1CB","가스 "+prevYear+"년"]].map((item) => (
              <span key={item[1]} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--color-text-secondary)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: item[0], display: "inline-block" }} />{item[1]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: mob ? 180 : 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bdRows} barSize={mob ? 7 : 10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={fmtW} axisLine={false} tickLine={false} width={42} />
              <Tooltip formatter={(v, n) => [Number(v).toLocaleString("ko-KR") + "원", n]} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="elecCurr" fill="#378ADD" radius={[2,2,0,0]} name={"전기 "+selYear+"년"} />
              <Bar dataKey="elecPrev" fill="#B5D4F4" radius={[2,2,0,0]} name={"전기 "+prevYear+"년"} />
              <Bar dataKey="gasCurr" fill="#1D9E75" radius={[2,2,0,0]} name={"가스 "+selYear+"년"} />
              <Bar dataKey="gasPrev" fill="#9FE1CB" radius={[2,2,0,0]} name={"가스 "+prevYear+"년"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: mob ? "0.875rem" : "1.25rem" }}>
        <div style={{ fontSize: mob ? 12 : 14, fontWeight: 500, marginBottom: "0.875rem" }}>{selYear}년 월별 통합 요금</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 360 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
                <th style={{ padding: "5px 7px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: 500 }}>월</th>
                <th style={{ padding: "5px 7px", textAlign: "right", color: "#185FA5", fontWeight: 500, borderLeft: "2px solid #378ADD" }}>전기요금(원)</th>
                <th style={{ padding: "5px 7px", textAlign: "right", color: "#085041", fontWeight: 500, borderLeft: "2px solid #1D9E75" }}>가스요금(원)</th>
                <th style={{ padding: "5px 7px", textAlign: "right", fontWeight: 500, borderLeft: "1px solid var(--color-border-secondary)" }}>합계(원)</th>
                <th style={{ padding: "5px 7px", textAlign: "right", color: "var(--color-text-tertiary)", fontWeight: 400, fontSize: 10 }}>전년 합계</th>
              </tr>
            </thead>
            <tbody>
              {MLABELS.map((m, i) => {
                const d = data[mkey(selYear, i + 1)] || {};
                const pd = data[mkey(prevYear, i + 1)] || {};
                const ec = (d.e1_cost || 0) + (d.e2_cost || 0);
                const gc = (d.gas1_cost || 0) + (d.gas2_cost || 0);
                const tot = ec + gc;
                const ptot = (pd.e1_cost||0)+(pd.e2_cost||0)+(pd.gas1_cost||0)+(pd.gas2_cost||0);
                const c = pct(tot, ptot);
                return (
                  <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "5px 7px", fontWeight: 500 }}>{m}</td>
                    <td style={{ padding: "5px 7px", textAlign: "right", background: "#F0F6FD", borderLeft: "2px solid #378ADD" }}>{ec ? fmt(ec) : "-"}</td>
                    <td style={{ padding: "5px 7px", textAlign: "right", background: "#F4FCF8", borderLeft: "2px solid #1D9E75" }}>{gc ? fmt(gc) : "-"}</td>
                    <td style={{ padding: "5px 7px", textAlign: "right", fontWeight: 500, borderLeft: "1px solid var(--color-border-secondary)" }}>{tot ? fmt(tot) : "-"}</td>
                    <td style={{ padding: "5px 7px", textAlign: "right", color: "var(--color-text-tertiary)" }}>
                      {ptot ? fmt(ptot) : "-"}
                      {c != null && tot ? <span style={{ fontSize: 10, marginLeft: 3, color: c > 0 ? "#A32D2D" : "#3B6D11" }}>({fmtP(c)})</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabElec({ data, selYear, prevYear, mob, lmE, cliE, setCliE }) {
  const ut = lmE || 12;
  const e1C = sumTo(data,selYear,"e1_cost",ut), pe1C = sumTo(data,prevYear,"e1_cost",ut);
  const e2C = sumTo(data,selYear,"e2_cost",ut), pe2C = sumTo(data,prevYear,"e2_cost",ut);
  const e1U = sumTo(data,selYear,"e1_usage",ut), e2U = sumTo(data,selYear,"e2_usage",ut);
  const pe1U = sumTo(data,prevYear,"e1_usage",ut), pe2U = sumTo(data,prevYear,"e2_usage",ut);
  const sfx = ut < 12 ? " (1~" + ut + "월)" : "";
  const barRows = MLABELS.map((m,i) => { const d=data[mkey(selYear,i+1)]||{}; const pd=data[mkey(prevYear,i+1)]||{}; return {name:m,curr:((d.e1_cost||0)+(d.e2_cost||0))||null,prev:((pd.e1_cost||0)+(pd.e2_cost||0))||null}; });
  const useRows = MLABELS.map((m,i) => { const d=data[mkey(selYear,i+1)]||{}; const pd=data[mkey(prevYear,i+1)]||{}; return {name:m,curr:((d.e1_usage||0)+(d.e2_usage||0))||null,prev:((pd.e1_usage||0)+(pd.e2_usage||0))||null,a:d.e1_usage||0,b:d.e2_usage||0}; });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1rem" }}>
        <Card label={"전기요금 합계"+sfx} val={e1C+e2C} prev={pe1C+pe2C} unit="원" accent="#378ADD" mob={mob} py={prevYear} />
        <Card label="기본전기 요금" val={e1C} prev={pe1C} unit="원" mob={mob} py={prevYear} />
        <Card label="냉난방 요금" val={e2C} prev={pe2C} unit="원" mob={mob} py={prevYear} />
        <Card label="전기사용량 합계" val={e1U+e2U} prev={pe1U+pe2U} unit="kWh" mob={mob} py={prevYear} />
      </div>
      <BarChart2 title={"월별 전기요금 합계 ("+selYear+"년 vs "+prevYear+"년)"} rows={barRows} mob={mob} cy={selYear} py={prevYear} cc="#378ADD" />
      <UsageLine title="월별 전기사용량 추이" rows={useRows} mob={mob} cy={selYear} py={prevYear} unit="kWh" cc="#378ADD" pc="#B5D4F4" l1="기본" l2="냉난방" clicked={cliE} onSet={setCliE} onClear={() => setCliE(null)} />
      <MTable year={selYear} data={data} mob={mob}
        c1={{ fs:["e1_usage","e1_cost"], sl:["사용량(kWh)","요금(원)"], bg:"#EBF3FC", cb:"#F0F6FD", tc:"#0C447C", bd:"#378ADD" }}
        c2={{ fs:["e2_usage","e2_cost"], sl:["사용량(kWh)","요금(원)"], bg:"#E6F1FB", cb:"#F4F8FD", tc:"#185FA5", bd:"#5D96CC" }}
        lbs={["기본전기 (01-0072-8018)","냉난방 (01-6224-6486)"]} />
    </div>
  );
}

function TabGas({ data, selYear, prevYear, mob, lmG, cliG, setCliG }) {
  const ut = lmG || 12;
  const g1C = sumTo(data,selYear,"gas1_cost",ut), pg1C = sumTo(data,prevYear,"gas1_cost",ut);
  const g2C = sumTo(data,selYear,"gas2_cost",ut), pg2C = sumTo(data,prevYear,"gas2_cost",ut);
  const g1U = sumTo(data,selYear,"gas1_usage",ut), g2U = sumTo(data,selYear,"gas2_usage",ut);
  const pg1U = sumTo(data,prevYear,"gas1_usage",ut), pg2U = sumTo(data,prevYear,"gas2_usage",ut);
  const sfx = ut < 12 ? " (1~" + ut + "월)" : "";
  const barRows = MLABELS.map((m,i) => { const d=data[mkey(selYear,i+1)]||{}; const pd=data[mkey(prevYear,i+1)]||{}; return {name:m,curr:((d.gas1_cost||0)+(d.gas2_cost||0))||null,prev:((pd.gas1_cost||0)+(pd.gas2_cost||0))||null}; });
  const useRows = MLABELS.map((m,i) => { const d=data[mkey(selYear,i+1)]||{}; const pd=data[mkey(prevYear,i+1)]||{}; return {name:m,curr:((d.gas1_usage||0)+(d.gas2_usage||0))||null,prev:((pd.gas1_usage||0)+(pd.gas2_usage||0))||null,a:d.gas1_usage||0,b:d.gas2_usage||0}; });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1rem" }}>
        <Card label={"가스요금 합계"+sfx} val={g1C+g2C} prev={pg1C+pg2C} unit="원" accent="#1D9E75" mob={mob} py={prevYear} />
        <Card label="5층주방 요금" val={g1C} prev={pg1C} unit="원" mob={mob} py={prevYear} />
        <Card label="옥상냉난방 요금" val={g2C} prev={pg2C} unit="원" mob={mob} py={prevYear} />
        <Card label="가스사용량 합계" val={g1U+g2U} prev={pg1U+pg2U} unit="m3" mob={mob} py={prevYear} />
      </div>
      <BarChart2 title={"월별 가스요금 합계 ("+selYear+"년 vs "+prevYear+"년)"} rows={barRows} mob={mob} cy={selYear} py={prevYear} cc="#1D9E75" />
      <UsageLine title="월별 가스사용량 추이" rows={useRows} mob={mob} cy={selYear} py={prevYear} unit="m3" cc="#1D9E75" pc="#9FE1CB" l1="5층" l2="옥상" clicked={cliG} onSet={setCliG} onClear={() => setCliG(null)} />
      <MTable year={selYear} data={data} mob={mob}
        c1={{ fs:["gas1_heat","gas1_usage","gas1_cost"], sl:["열량(MJ)","사용량(m3)","요금(원)"], bg:"#E1F5EE", cb:"#F4FCF8", tc:"#085041", bd:"#1D9E75" }}
        c2={{ fs:["gas2_heat","gas2_usage","gas2_cost"], sl:["열량(MJ)","사용량(m3)","요금(원)"], bg:"#D8F2E8", cb:"#EDF8F3", tc:"#0F6E56", bd:"#0F6E56" }}
        lbs={["5층주방 (6000905480)","옥상냉난방 (6000909299)"]} />
    </div>
  );
}

function TabCompare({ data, allYears, mob }) {
  const rows4 = [
    { label: "전기요금 합계", f1: "e1_cost", f2: "e2_cost", color: "#185FA5" },
    { label: "가스요금 합계", f1: "gas1_cost", f2: "gas2_cost", color: "#085041" },
    { label: "총 에너지비용", f1: null, f2: null, bold: true },
    { label: "전기사용량(kWh)", f1: "e1_usage", f2: "e2_usage", color: "#378ADD" },
    { label: "가스사용량(m3)", f1: "gas1_usage", f2: "gas2_usage", color: "#1D9E75" },
  ];

  const getVal = (y, lm2, row) => {
    if (row.bold) {
      return ["e1_cost","e2_cost","gas1_cost","gas2_cost"].reduce((s, f) => s + sumTo(data, y, f, lm2), 0);
    }
    return sumTo(data, y, row.f1, lm2) + sumTo(data, y, row.f2, lm2);
  };

  const makeYL = (f1, f2) => MLABELS.map((m, i) => {
    const row = { name: m };
    allYears.forEach(y => {
      const d = data[mkey(y, i + 1)] || {};
      const v = (d[f1] || 0) + (d[f2] || 0);
      row[y] = v || null;
    });
    return row;
  });

  const secs = [
    { title: "월별 전기요금 합계 (원)", f1: "e1_cost", f2: "e2_cost", color: "#378ADD" },
    { title: "월별 가스요금 합계 (원)", f1: "gas1_cost", f2: "gas2_cost", color: "#1D9E75" },
    { title: "월별 전기사용량 합계 (kWh)", f1: "e1_usage", f2: "e2_usage", color: "#5D96CC" },
    { title: "월별 가스사용량 합계 (m3)", f1: "gas1_usage", f2: "gas2_usage", color: "#0F6E56" },
  ];

  return (
    <div>
      {/* 연도별 총합 비교 테이블 */}
      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:mob?"0.875rem":"1.25rem", marginBottom:"0.875rem" }}>
        <div style={{ fontSize:mob?12:14, fontWeight:500, marginBottom:"1rem" }}>연도별 총합 비교</div>
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", fontSize:mob?10:12, borderCollapse:"collapse", minWidth:mob?260:360 }}>
            <thead>
              <tr style={{ borderBottom:"0.5px solid var(--color-border-secondary)" }}>
                <th style={{ padding:mob?"4px 5px":"6px 8px", textAlign:"left", color:"var(--color-text-secondary)", fontWeight:500, fontSize:mob?10:12, whiteSpace:"nowrap" }}>항목</th>
                {allYears.map(y => {
                  const lm2 = Math.max(lastM(data, y, "e1_cost"), lastM(data, y, "gas1_cost"));
                  return (
                    <th key={y} style={{ padding:mob?"4px 5px":"6px 8px", textAlign:"right", color:"var(--color-text-secondary)", fontWeight:500, whiteSpace:"nowrap", fontSize:mob?10:12 }}>
                      {y}
                      {lm2 > 0 && lm2 < 12 && <span style={{ fontSize:9, marginLeft:2, color:"#185FA5", display:"block" }}>({lm2}월)</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows4.map((row, ri) => (
                <tr key={ri} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:row.bold?"var(--color-background-secondary)":"transparent" }}>
                  <td style={{ padding:mob?"4px 5px":"6px 8px", color:row.color||"var(--color-text-primary)", fontWeight:row.bold?500:400, fontSize:mob?10:12, whiteSpace:"nowrap" }}>{row.label}</td>
                  {allYears.map((y, yi) => {
                    const lm2 = Math.max(lastM(data, y, "e1_cost"), lastM(data, y, "gas1_cost")) || 12;
                    const val = getVal(y, lm2, row);
                    const py2 = allYears[yi - 1];
                    const pval = py2 ? getVal(py2, lm2, row) : null;
                    const c = pct(val, pval);
                    return (
                      <td key={y} style={{ padding:mob?"4px 5px":"6px 8px", textAlign:"right", fontWeight:row.bold?500:400 }}>
                        <div style={{ fontSize:mob?10:12 }}>{val > 0 ? fmt(val) : "-"}</div>
                        {c != null && val > 0 && (
                          <div style={{ fontSize:9, color:c > 0 ? "#A32D2D" : "#3B6D11" }}>
                            {fmtP(c)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <YearLine title="연도별 월별 전기요금 비교" rows={makeYL("e1_cost","e2_cost")} years={allYears} mob={mob} unit="원" />
      <YearLine title="연도별 월별 가스요금 비교" rows={makeYL("gas1_cost","gas2_cost")} years={allYears} mob={mob} unit="원" />

      {secs.map((sec, si) => {
        const trows = makeYL(sec.f1, sec.f2);
        return (
          <div key={si} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:mob?"0.875rem":"1.25rem", marginBottom:"0.875rem" }}>
            <div style={{ fontSize:mob?12:13, fontWeight:500, marginBottom:"0.875rem" }}>{sec.title}</div>
            <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
              <table style={{ width:"100%", fontSize:mob?10:11, borderCollapse:"collapse", minWidth:mob?240:300 }}>
                <thead>
                  <tr style={{ borderBottom:"0.5px solid var(--color-border-secondary)" }}>
                    <th style={{ padding:mob?"4px 5px":"5px 7px", textAlign:"left", color:"var(--color-text-secondary)", fontWeight:500, width:mob?28:36, fontSize:mob?10:11 }}>월</th>
                    {allYears.map(y => {
                      const lm2 = lastM(data, y, sec.f1);
                      return (
                        <th key={y} style={{ padding:mob?"4px 5px":"5px 7px", textAlign:"right", color:sec.color, fontWeight:500, whiteSpace:"nowrap", fontSize:mob?10:11 }}>
                          {y}
                          {lm2 > 0 && lm2 < 12 && <span style={{ fontSize:9, color:"#185FA5", display:"block" }}>({lm2}월)</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {trows.map((row, mi) => (
                    <tr key={mi} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", opacity:allYears.some(y => row[y]) ? 1 : 0.4 }}>
                      <td style={{ padding:mob?"4px 5px":"5px 7px", fontWeight:500, fontSize:mob?10:11 }}>{row.name}</td>
                      {allYears.map((y, yi) => {
                        const val = row[y];
                        const pval = yi > 0 ? trows[mi][allYears[yi - 1]] : null;
                        const c = pct(val, pval);
                        return (
                          <td key={y} style={{ padding:mob?"4px 5px":"5px 7px", textAlign:"right" }}>
                            <div style={{ color:val?"var(--color-text-primary)":"var(--color-text-tertiary)", fontWeight:val?500:400, fontSize:mob?10:11 }}>
                              {val ? fmt(val) : "-"}
                            </div>
                            {c != null && val && (
                              <div style={{ fontSize:9, color:c > 0 ? "#A32D2D" : "#3B6D11" }}>
                                {fmtP(c)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ borderTop:"1px solid var(--color-border-secondary)", background:"var(--color-background-secondary)" }}>
                    <td style={{ padding:mob?"4px 5px":"5px 7px", fontSize:mob?9:10, color:"var(--color-text-secondary)" }}>합계</td>
                    {allYears.map((y, yi) => {
                      const lm2 = lastM(data, y, sec.f1) || 12;
                      const val = sumTo(data, y, sec.f1, lm2) + sumTo(data, y, sec.f2, lm2);
                      const py2 = allYears[yi - 1];
                      const pv = py2 ? sumTo(data, py2, sec.f1, lm2) + sumTo(data, py2, sec.f2, lm2) : null;
                      const c = pct(val, pv);
                      return (
                        <td key={y} style={{ padding:mob?"4px 5px":"5px 7px", textAlign:"right" }}>
                          <div style={{ color:sec.color, fontWeight:500, fontSize:mob?10:11 }}>{val > 0 ? fmt(val) : "-"}</div>
                          {c != null && val > 0 && (
                            <div style={{ fontSize:9, color:c > 0 ? "#A32D2D" : "#3B6D11" }}>
                              {fmtP(c)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabEntry({ stored, setStored, mob }) {
  const [eYear, setEYear] = useState("2026");
  const [eMonth, setEMonth] = useState("03");
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState({});
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const bm2 = Number(eMonth);
    const um2 = bm2 === 1 ? 12 : bm2 - 1;
    const uy2 = bm2 === 1 ? Number(eYear) - 1 : Number(eYear);
    const k = uy2 + "-" + String(um2).padStart(2, "0");
    const base = Object.assign({}, EBASE[k] || {}, GBASE[k] || {});
    setForm(Object.assign({}, base, stored[k] || {}));
  }, [eYear, eMonth, stored]);

  const bm = Number(eMonth);
  const um = bm === 1 ? 12 : bm - 1;
  const uy = bm === 1 ? Number(eYear) - 1 : Number(eYear);

  const applyAndSave = useCallback(async (patch, sheetSaves) => {
    const k = uy + "-" + String(um).padStart(2, "0");
    const updated = Object.assign({}, stored, { [k]: Object.assign({}, stored[k] || {}, patch) });
    setStored(updated);
    try { localStorage.setItem(SKEY, JSON.stringify(updated)); } catch (e) {}
    setSyncing(true);
    await Promise.all(sheetSaves.map(({ sheet, data }) => saveToSheet(sheet, uy, um, data)));
    setSyncing(false);
  }, [stored, uy, um, setStored]);

  const saveFields = useCallback(async (fields, firstField) => {
    const patch = {};
    fields.forEach(f => { if (form[f] != null && form[f] !== "") patch[f] = Number(form[f]); });
    const bySheet = {};
    fields.forEach(f => {
      const sn = FIELD_TO_SHEET[f];
      if (sn && form[f] != null && form[f] !== "") {
        bySheet[sn] = bySheet[sn] || {};
        bySheet[sn][f] = Number(form[f]);
      }
    });
    const sheetSaves = Object.entries(bySheet).map(([sheet, data]) => ({ sheet, data }));
    await applyAndSave(patch, sheetSaves);
    setSaved(s => Object.assign({}, s, { [firstField]: true }));
    setTimeout(() => setSaved(s => Object.assign({}, s, { [firstField]: false })), 2000);
  }, [form, applyAndSave]);

  const saveAll = useCallback(async () => {
    const patch = {};
    Object.keys(form).forEach(f => { if (form[f] != null && form[f] !== "") patch[f] = Number(form[f]); });
    const bySheet = {};
    Object.keys(form).forEach(f => {
      const sn = FIELD_TO_SHEET[f];
      if (sn && form[f] != null && form[f] !== "") {
        bySheet[sn] = bySheet[sn] || {};
        bySheet[sn][f] = Number(form[f]);
      }
    });
    const sheetSaves = Object.entries(bySheet).map(([sheet, data]) => ({ sheet, data }));
    await applyAndSave(patch, sheetSaves);
    setSaved({ all: true });
    setTimeout(() => setSaved({}), 2000);
  }, [form, applyAndSave]);

  const eAccs = [
    { id: "e1", label: "기본전기", sub: "01-0072-8018", color: "#378ADD", bg: "#EBF3FC", bd: "#378ADD" },
    { id: "e2", label: "4,5층 냉난방", sub: "01-6224-6486 (2025.10~)", color: "#5D96CC", bg: "#E6F1FB", bd: "#5D96CC" },
  ];
  const gAccs = [
    { id: "gas1", label: "5층주방", sub: "6000905480", color: "#1D9E75", bg: "#E1F5EE", bd: "#1D9E75" },
    { id: "gas2", label: "옥상냉난방", sub: "6000909299", color: "#0F6E56", bg: "#D8F2E8", bd: "#0F6E56" },
  ];

  return (
    <div>
      <div style={{ background: "#E6F1FB", border: "0.5px solid #B5D4F4", borderRadius: 8, padding: "10px 14px", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 13, color: "#0C447C", fontWeight: 500 }}>[청구서] {eYear}년 {bm}월 입력</span>
          <span style={{ fontSize: 12, color: "#185FA5", marginLeft: 10 }}>→ <strong>{uy}년 {um}월 사용량</strong>으로 반영</span>
        </div>
        {syncing && <span style={{ fontSize: 11, color: "#534AB7", fontWeight: 500 }}>☁️ 구글 시트 저장 중...</span>}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>청구서 연도</label>
          <select value={eYear} onChange={e => setEYear(e.target.value)}
            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}>
            {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>청구서 월</label>
          <select value={eMonth} onChange={e => setEMonth(e.target.value)}
            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}>
            {MLABELS.map((m, i) => <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#185FA5", marginBottom: "0.625rem" }}>전기요금 (사용월 기준)</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12 }}>
          {eAccs.map(acc => {
            const ek = eYear + "-" + eMonth;
            const existCost = (EBASE[ek] || {})[acc.id + "_cost"];
            const eFields = [
              { f: acc.id+"_usage", label: "사용량", unit: "kWh", ph: "예: 2500" },
              { f: acc.id+"_cost", label: "납부요금", unit: "원", ph: "예: 650000" },
            ];
            return (
              <div key={acc.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid "+acc.bd+"40", borderRadius: 12, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.875rem" }}>
                  <div style={{ width:32,height:32,borderRadius:8,background:acc.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <div style={{ width:10,height:10,borderRadius:2,background:acc.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:500 }}>{acc.label}</div>
                    <div style={{ fontSize:10,color:"var(--color-text-tertiary)" }}>{acc.sub}</div>
                  </div>
                  {existCost && <div style={{ marginLeft:"auto",fontSize:10,color:acc.color }}>기존: {fmt(existCost)}원</div>}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {eFields.map(field => (
                    <div key={field.f}>
                      <label style={{ fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3 }}>{field.label} ({field.unit})</label>
                      <input type="number" placeholder={field.ph} value={form[field.f]!=null?form[field.f]:""}
                        onChange={ev => setForm(p => Object.assign({},p,{[field.f]:ev.target.value}))}
                        style={{ width:"100%",padding:"7px 8px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box" }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"0.75rem",display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8 }}>
                  {saved[acc.id+"_usage"] && <span style={{ fontSize:11,color:acc.color,fontWeight:500 }}>저장됨! ✓</span>}
                  <button onClick={() => saveFields([acc.id+"_usage",acc.id+"_cost"], acc.id+"_usage")}
                    style={{ padding:"6px 16px",fontSize:12,fontWeight:500,borderRadius:6,border:"0.5px solid "+acc.bd,background:"transparent",color:acc.color,cursor:"pointer" }}>
                    {acc.label} 저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize:12,fontWeight:500,color:"#085041",marginBottom:"0.625rem" }}>가스요금 (사용월 기준)</div>
        <div style={{ display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12 }}>
          {gAccs.map(acc => {
            const gk = eYear + "-" + eMonth;
            const existCost = (GBASE[gk] || {})[acc.id+"_cost"];
            const gFields = [
              { f:acc.id+"_usage", label:"사용량", unit:"m3", ph:"예: 20" },
              { f:acc.id+"_heat", label:"사용열량", unit:"MJ", ph:"예: 845" },
              { f:acc.id+"_cost", label:"결제금액", unit:"원", ph:"예: 22570" },
            ];
            return (
              <div key={acc.id} style={{ background:"var(--color-background-primary)",border:"0.5px solid "+acc.bd+"40",borderRadius:12,padding:"1rem" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:"0.875rem" }}>
                  <div style={{ width:32,height:32,borderRadius:8,background:acc.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <div style={{ width:10,height:10,borderRadius:2,background:acc.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:500 }}>{acc.label}</div>
                    <div style={{ fontSize:10,color:"var(--color-text-tertiary)" }}>{acc.sub}</div>
                  </div>
                  {existCost && <div style={{ marginLeft:"auto",fontSize:10,color:acc.color }}>기존: {fmt(existCost)}원</div>}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                  {gFields.map(field => (
                    <div key={field.f}>
                      <label style={{ fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3 }}>{field.label} ({field.unit})</label>
                      <input type="number" placeholder={field.ph} value={form[field.f]!=null?form[field.f]:""}
                        onChange={ev => setForm(p => Object.assign({},p,{[field.f]:ev.target.value}))}
                        style={{ width:"100%",padding:"7px 8px",fontSize:12,borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",boxSizing:"border-box" }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"0.75rem",display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8 }}>
                  {saved[acc.id+"_usage"] && <span style={{ fontSize:11,color:acc.color,fontWeight:500 }}>저장됨! ✓</span>}
                  <button onClick={() => saveFields([acc.id+"_usage",acc.id+"_heat",acc.id+"_cost"], acc.id+"_usage")}
                    style={{ padding:"6px 16px",fontSize:12,fontWeight:500,borderRadius:6,border:"0.5px solid "+acc.bd,background:"transparent",color:acc.color,cursor:"pointer" }}>
                    {acc.label} 저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display:"flex",gap:12,alignItems:"center" }}>
        <button onClick={saveAll}
          style={{ padding:"10px 32px",fontSize:13,fontWeight:500,borderRadius:8,border:"none",background:"#534AB7",color:"#fff",cursor:"pointer",opacity:syncing?0.7:1 }}>
          {syncing ? "저장 중..." : saved.all ? "저장됨! ✓" : "전체 저장"}
        </button>
        {saved.all && <span style={{ fontSize:12,color:"#534AB7",fontWeight:500 }}>☁️ 구글 시트 저장 완료!</span>}
        <span style={{ fontSize:10,color:"var(--color-text-tertiary)",marginLeft:"auto" }}>전기/가스 모두 사용월 기준 (청구월 - 1개월)</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("main");
  const [stored, setStored] = useState({});
  const [loading, setLoading] = useState(true);
  const [sheetStatus, setSheetStatus] = useState("loading");
  const [selYear, setSelYear] = useState("2026");
  const [cliE, setCliE] = useState(null);
  const [cliG, setCliG] = useState(null);
  const winW = useWinW();
  const mob = winW < 640;

  useEffect(() => {
    async function init() {
      let localData = {};
      try {
        const r = localStorage.getItem(SKEY);
        if (r) localData = JSON.parse(r);
      } catch (e) {}
      setStored(localData);
      setLoading(false);
      try {
        const sheetData = await loadFromSheets();
        const merged = {};
        const allKeys = new Set([...Object.keys(localData), ...Object.keys(sheetData)]);
        allKeys.forEach(k => { merged[k] = Object.assign({}, localData[k] || {}, sheetData[k] || {}); });
        setStored(merged);
        try { localStorage.setItem(SKEY, JSON.stringify(merged)); } catch (e) {}
        setSheetStatus("ok");
      } catch (e) {
        setSheetStatus("error");
      }
    }
    init();
  }, []);

  const data = merge(stored);
  const allYears = [...new Set(["2023","2024","2025","2026",...Object.keys(data).map(k => k.slice(0,4))])].sort();
  const prevYear = String(Number(selYear) - 1);

  useEffect(() => { setCliE(null); setCliG(null); }, [selYear]);

  const lmE = Math.max(lastM(data,selYear,"e1_cost"),lastM(data,selYear,"e2_cost"));
  const lmG = Math.max(lastM(data,selYear,"gas1_cost"),lastM(data,selYear,"gas2_cost"));
  const lmAll = Math.max(lmE, lmG);
  const upTo = lmAll || 12;
  const isPartial = lmAll > 0 && lmAll < 12;
  const compareLabel = isPartial ? selYear+"년 1~"+upTo+"월 -> "+prevYear+"년 동일기간" : selYear+"년 전체 -> "+prevYear+"년 전체";

  const tabSt = (id) => ({
    padding: mob ? "8px 10px" : "8px 16px", fontSize: mob ? 12 : 13,
    border: "none", background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
    color: tab === id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    borderBottom: tab === id ? "2px solid var(--color-text-primary)" : "2px solid transparent",
    fontWeight: tab === id ? 500 : 400, marginBottom: -1
  });

  if (loading) return <div style={{ padding:"2rem", color:"var(--color-text-secondary)" }}>불러오는 중...</div>;

  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:980, margin:"0 auto", padding:mob?"0.75rem 0.75rem 3rem":"1rem 1rem 3rem" }}>
      <div style={{ marginBottom:"1rem", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexDirection:mob?"column":"row", gap:8 }}>
        <div>
          <div style={{ fontSize:10, color:"var(--color-text-tertiary)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>전기, 가스요금 전기 관리 대시보드</div>
          <h1 style={{ fontSize:mob?17:21, fontWeight:500, margin:0 }}>대한예수교장로회 행복한교회</h1>
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
          {["기본전기 01-0072-8018","냉난방전기 01-6224-6486","5층가스 6000905480","냉난방가스 6000909299"].map((t,i) => (
            <span key={i} style={{ fontSize:10, padding:"3px 8px", borderRadius:20, background:i<2?"#E6F1FB":"#E1F5EE", color:i<2?"#0C447C":"#085041", fontWeight:500 }}>{t}</span>
          ))}
          <span style={{ fontSize:10, padding:"3px 8px", borderRadius:20, fontWeight:500,
            background:sheetStatus==="ok"?"#E1F5EE":sheetStatus==="error"?"#FCEBEB":"#F5F5F5",
            color:sheetStatus==="ok"?"#085041":sheetStatus==="error"?"#A32D2D":"#888" }}>
            {sheetStatus==="ok"?"☁️ 시트 연결됨":sheetStatus==="error"?"⚠️ 시트 연결 실패":"☁️ 연결 중..."}
          </span>
        </div>
      </div>
      <div style={{ display:"flex", gap:0, marginBottom:"1.25rem", borderBottom:"0.5px solid var(--color-border-tertiary)", overflowX:"auto" }}>
        {[["main","통합 현황"],["elec","전기요금"],["gas","가스요금"],["compare","연도 비교"],["entry","데이터 입력"]].map(item => (
          <button key={item[0]} onClick={() => setTab(item[0])} style={tabSt(item[0])}>{item[1]}</button>
        ))}
      </div>
      {(tab==="main"||tab==="elec"||tab==="gas") && (
        <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
          <label style={{ fontSize:12, color:"var(--color-text-secondary)" }}>조회 연도</label>
          <select value={selYear} onChange={e => setSelYear(e.target.value)}
            style={{ fontSize:13, padding:"4px 10px", borderRadius:6, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-secondary)", color:"var(--color-text-primary)" }}>
            {allYears.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          {lmAll > 0 && (
            <div style={{ fontSize:mob?11:12, padding:"4px 10px", borderRadius:6, background:"#E6F1FB", color:"#185FA5", border:"0.5px solid #B5D4F4" }}>
              {compareLabel}
            </div>
          )}
        </div>
      )}
      {tab==="main" && <TabMain data={data} selYear={selYear} prevYear={prevYear} allYears={allYears} mob={mob} lmAll={lmAll} upTo={upTo} isPartial={isPartial} />}
      {tab==="elec" && <TabElec data={data} selYear={selYear} prevYear={prevYear} mob={mob} lmE={lmE} cliE={cliE} setCliE={setCliE} />}
      {tab==="gas" && <TabGas data={data} selYear={selYear} prevYear={prevYear} mob={mob} lmG={lmG} cliG={cliG} setCliG={setCliG} />}
      {tab==="compare" && <TabCompare data={data} allYears={allYears} mob={mob} />}
      {tab==="entry" && <TabEntry stored={stored} setStored={setStored} mob={mob} />}
    </div>
  );
}
