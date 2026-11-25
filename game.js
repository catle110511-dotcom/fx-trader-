/* =====================================================================
   game.js — 게임 규칙과 계산 (화면과 무관)
   ※ 그래픽 작업 시 이 파일은 수정하지 마세요.
   ===================================================================== */
window.Game = (() => {
  const D = window.FXDATA;
  const DEM_PER_EUR = 1.95583;

  // ---------- 날짜 ----------
  const ym2i = s => { const [y, m] = s.split("-").map(Number); return (y - 1970) * 12 + (m - 1); };
  const i2ym = i => ({ y: 1970 + Math.floor(i / 12), m: (i % 12) + 1 });
  const LAST = ym2i(D.last);
  const EURO_START = ym2i("1999-01");

  // ---------- 시장·상품 ----------
  // 항구: 위치(위도·경도), 지역, 통화, 특산품, 개장 시각(한국 시각, 대략), 열리는 달(환율 데이터 시작)
  const MARKETS = [
    { id: "seoul",     name: "서울",        cur: "KRW", good: "kr",  open: "09:00", lat: 37.5,  lon: 127.0,  region: "ea" },
    { id: "tokyo",     name: "도쿄",        cur: "JPY", good: "jp",  open: "09:00", lat: 35.7,  lon: 139.7,  region: "ea" },
    { id: "shanghai",  name: "상하이",      cur: "CNY", good: "cn",  open: "10:30", lat: 31.2,  lon: 121.5,  region: "ea", from: "1981-01" },
    { id: "hongkong",  name: "홍콩",        cur: "HKD", good: "hk",  open: "10:30", lat: 22.3,  lon: 114.2,  region: "ea", from: "1981-01" },
    { id: "bangkok",   name: "방콕",        cur: "THB", good: "th",  open: "12:00", lat: 13.75, lon: 100.5,  region: "se", from: "1981-01" },
    { id: "singapore", name: "싱가포르",    cur: "SGD", good: "sg",  open: "10:00", lat: 1.3,   lon: 103.8,  region: "se", below: true, from: "1981-01" },
    { id: "mumbai",    name: "뭄바이",      cur: "INR", good: "in",  open: "12:45", lat: 19.1,  lon: 72.9,   region: "se", from: "1973-01" },
    { id: "dubai",     name: "두바이",      cur: "AED", good: "oil", open: "14:00", lat: 25.2,  lon: 55.3,   region: "me" },
    { id: "capetown",  name: "케이프타운",  cur: "ZAR", good: "za",  open: "16:00", lat: -33.9, lon: 18.4,   region: "me" },
    { id: "frankfurt", name: "프랑크푸르트", cur: "EUR", good: "de",  open: "17:00", lat: 50.1,  lon: 8.7,    region: "we" },
    { id: "zurich",    name: "취리히",      cur: "CHF", good: "ch",  open: "17:00", lat: 47.4,  lon: 8.5,    region: "we", below: true },
    { id: "london",    name: "런던",        cur: "GBP", good: "uk",  open: "18:00", lat: 51.5,  lon: -0.1,   region: "we" },
    { id: "newyork",   name: "뉴욕",        cur: "USD", good: "us",  open: "23:30", lat: 40.7,  lon: -74.0,  region: "na" },
    { id: "saopaulo",  name: "상파울루",    cur: "BRL", good: "br",  open: "22:00", lat: -23.5, lon: -46.6,  region: "la", from: "1995-01" },
    { id: "vancouver", name: "밴쿠버",      cur: "CAD", good: "ca",  open: "02:30", lat: 49.3,  lon: -123.1, region: "na" },
    { id: "sydney",    name: "시드니",      cur: "AUD", good: "au",  open: "08:00", lat: -33.9, lon: 151.2,  region: "oc" },
    { id: "taipei",    name: "타이베이",    cur: "TWD", good: "tw",  open: "10:00", lat: 25.0,  lon: 121.5,  region: "ea", from: "1984-01" },
    { id: "kualalumpur", name: "쿠알라룸푸르", cur: "MYR", good: "my", open: "10:00", lat: 3.1, lon: 101.7, region: "se" },
    { id: "colombo",   name: "콜롬보",      cur: "LKR", good: "lk",  open: "12:30", lat: 6.9,   lon: 79.9,   region: "se", from: "1973-01" },
    { id: "paris",     name: "파리",        cur: "FRF", good: "fr",  open: "17:00", lat: 48.9,  lon: 2.35,   region: "we", below: true },
    { id: "rotterdam", name: "로테르담",    cur: "NLG", good: "nl",  open: "17:00", lat: 51.9,  lon: 4.5,    region: "we" },
    { id: "antwerp",   name: "안트베르펜",  cur: "BEF", good: "be",  open: "17:00", lat: 51.2,  lon: 4.4,    region: "we", below: true },
    { id: "milan",     name: "밀라노",      cur: "ITL", good: "it",  open: "17:00", lat: 45.5,  lon: 9.2,    region: "so" },
    { id: "barcelona", name: "바르셀로나",  cur: "ESP", good: "es",  open: "17:00", lat: 41.4,  lon: 2.2,    region: "so", from: "1973-01" },
    { id: "lisbon",    name: "리스본",      cur: "PTE", good: "pt",  open: "18:00", lat: 38.7,  lon: -9.1,   region: "so", from: "1973-01" },
    { id: "athens",    name: "아테네",      cur: "GRD", good: "gr",  open: "16:00", lat: 37.9,  lon: 23.6,   region: "so", from: "1981-04" },
    { id: "stockholm", name: "스톡홀름",    cur: "SEK", good: "se",  open: "17:00", lat: 59.3,  lon: 18.1,   region: "no" },
    { id: "oslo",      name: "오슬로",      cur: "NOK", good: "no",  open: "17:00", lat: 59.9,  lon: 10.7,   region: "no" },
    { id: "copenhagen", name: "코펜하겐",   cur: "DKK", good: "dk",  open: "17:00", lat: 55.7,  lon: 12.6,   region: "no", below: true },
    { id: "losangeles", name: "로스앤젤레스", cur: "USD", good: "la", open: "02:30", lat: 34.0, lon: -118.3, region: "na" },
    { id: "mexicocity", name: "멕시코시티", cur: "MXN", good: "mx",  open: "00:30", lat: 19.4,  lon: -99.1,  region: "la", from: "1994-01" },
    { id: "auckland",  name: "오클랜드",    cur: "NZD", good: "nz",  open: "06:00", lat: -36.8, lon: 174.8,  region: "oc" }
  ];
  const REGIONS = [
    { id: "all", name: "전체" }, { id: "ea", name: "동아시아" }, { id: "se", name: "동남아·남아시아" }, { id: "me", name: "중동·아프리카" },
    { id: "we", name: "서유럽" }, { id: "no", name: "북유럽" }, { id: "so", name: "남유럽" },
    { id: "na", name: "북미" }, { id: "la", name: "중남미" }, { id: "oc", name: "오세아니아" }
  ];
  const M = Object.fromEntries(MARKETS.map(m => [m.id, m]));
  // 특산품: 그 나라에서 가장 유명한 것 (그림 파일 이름은 good-<id>.png)
  const GOODS = [
    { id: "kr",  origin: "seoul",     name: i => i < ym2i("1990-01") ? "의류" : "반도체", base: i => i < ym2i("1990-01") ? 25 : 80 },
    { id: "jp",  origin: "tokyo",     name: () => "전자제품",   base: () => 120 },
    { id: "cn",  origin: "shanghai",  name: () => "비단",       base: () => 60 },
    { id: "hk",  origin: "hongkong",  name: () => "장난감",     base: () => 25 },
    { id: "tw",  origin: "taipei",    name: () => "자전거",     base: () => 120 },
    { id: "th",  origin: "bangkok",   name: () => "쌀",         base: () => 8, perish: true },
    { id: "sg",  origin: "singapore", name: () => "석유화학제품", base: () => 40 },
    { id: "my",  origin: "kualalumpur", name: () => "팜유",     base: () => 15 },
    { id: "in",  origin: "mumbai",    name: () => "향신료",     base: () => 30 },
    { id: "lk",  origin: "colombo",   name: () => "홍차",       base: () => 20 },
    { id: "oil", origin: "dubai",     name: () => "원유",       base: null },
    { id: "za",  origin: "capetown",  name: () => "금",         base: () => 400 },
    { id: "de",  origin: "frankfurt", name: () => "자동차 부품", base: () => 150 },
    { id: "ch",  origin: "zurich",    name: () => "시계",       base: () => 300 },
    { id: "uk",  origin: "london",    name: () => "위스키",     base: () => 35 },
    { id: "fr",  origin: "paris",     name: () => "와인",       base: () => 40 },
    { id: "nl",  origin: "rotterdam", name: () => "튤립",       base: () => 10, perish: true },
    { id: "be",  origin: "antwerp",   name: () => "초콜릿",     base: () => 20 },
    { id: "it",  origin: "milan",     name: () => "가죽 가방",  base: () => 150 },
    { id: "es",  origin: "barcelona", name: () => "하몽",       base: () => 80 },
    { id: "pt",  origin: "lisbon",    name: () => "에그타르트", base: () => 5, perish: true },
    { id: "gr",  origin: "athens",    name: () => "올리브유",   base: () => 20 },
    { id: "se",  origin: "stockholm", name: () => "가구",       base: () => 100 },
    { id: "no",  origin: "oslo",      name: () => "연어",       base: () => 25, perish: true },
    { id: "dk",  origin: "copenhagen", name: () => "버터쿠키",  base: () => 12 },
    { id: "us",  origin: "newyork",   name: () => "밀",         base: () => 12, perish: true },
    { id: "la",  origin: "losangeles", name: () => "오렌지",    base: () => 8, perish: true },
    { id: "ca",  origin: "vancouver", name: () => "메이플시럽", base: () => 20 },
    { id: "mx",  origin: "mexicocity", name: () => "데킬라",    base: () => 30 },
    { id: "br",  origin: "saopaulo",  name: () => "커피",       base: () => 25 },
    { id: "au",  origin: "sydney",    name: () => "소고기",     base: () => 50, perish: true },
    { id: "nz",  origin: "auckland",  name: () => "키위",       base: () => 10, perish: true }
  ];
  const G = Object.fromEntries(GOODS.map(g => [g.id, g]));
  // 항해 기간: 두 항구 사이 거리(바닷길은 직선의 약 1.3배)로 1~4달
  function km(a, b) {
    const r = Math.PI / 180, A = M[a], B = M[b];
    const h = Math.sin((B.lat - A.lat) * r / 2) ** 2 + Math.cos(A.lat * r) * Math.cos(B.lat * r) * Math.sin((B.lon - A.lon) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  }
  const DIST = {};
  for (const a of MARKETS) for (const b of MARKETS) DIST[a.id + "-" + b.id] = a.id === b.id ? 0 : Math.min(4, Math.max(1, Math.ceil(km(a.id, b.id) * 1.3 / 9000)));
  const dist = (a, b) => DIST[a + "-" + b];
  const isOpen = (mid, i) => !M[mid].from || i >= ym2i(M[mid].from);

  const SCENARIOS = [
    { id: "70s", name: "1970년대", sub: "오일쇼크의 시대", from: "1973-03", to: "1979-12" },
    { id: "80s", name: "1980년대", sub: "플라자 합의와 서울 올림픽", from: "1980-01", to: "1989-12" },
    { id: "90s", name: "1990년대", sub: "걸프전, IMF, 유로 출범", from: "1990-01", to: "1999-12" },
    { id: "00s", name: "2000년대", sub: "월드컵과 금융위기", from: "2000-01", to: "2009-12" },
    { id: "10s", name: "2010년대", sub: "대지진, 유가 급락, 브렉시트", from: "2010-01", to: "2019-12" },
    { id: "20s", name: "2020년대 → 현재", sub: "팬데믹에서 오늘까지", from: "2020-01", to: D.last }
  ];

  // ---------- 지점장 후보 (초상화: assets/manager-1~6.png) ----------
  // neg 협상: 그 항구 거래가 1단계당 0.8% 유리 / eye 눈썰미: 차익 판단이 정확 / guts 배짱: 한 달에 다루는 물량
  const MANAGERS = [
    { id: 1, name: "강도윤", from: "서울 출신 무역회사 지배인", neg: 4, eye: 3, guts: 2 },
    { id: 2, name: "레오 마르티니", from: "부두 하역반장 출신", neg: 2, eye: 2, guts: 5 },
    { id: 3, name: "다나카 겐조", from: "상사 30년 경력의 회계통", neg: 3, eye: 5, guts: 1 },
    { id: 4, name: "에드먼드 그레이", from: "런던 해운중개인", neg: 5, eye: 3, guts: 2 },
    { id: 5, name: "마리 베버", from: "화물선 선장 출신", neg: 2, eye: 4, guts: 4 },
    { id: 6, name: "카림 하산", from: "걸프 지역 원자재 상인", neg: 4, eye: 2, guts: 4 }
  ];
  const MG = Object.fromEntries(MANAGERS.map(m => [m.id, m]));
  const statSum = m => m.neg + m.eye + m.guts;

  // ---------- 데이터 → 월별 시계열 ----------
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function build(str, vol, seed) {
    const pts = str.trim().split(/\s+/).map(t => { const [d, v] = t.split(":"); return [ym2i(d), +v]; });
    const out = new Float64Array(LAST + 1);
    const anchor = new Set(pts.map(p => p[0]));
    for (let i = 0; i <= LAST; i++) {
      let v;
      if (i <= pts[0][0]) v = pts[0][1];
      else if (i >= pts[pts.length - 1][0]) v = pts[pts.length - 1][1];
      else {
        let k = 0; while (pts[k + 1][0] < i) k++;
        const [i0, v0] = pts[k], [i1, v1] = pts[k + 1];
        const t = (i - i0) / (i1 - i0);
        v = Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * t);
      }
      if (vol && !anchor.has(i)) v *= Math.exp((hash(i, seed) - 0.5) * 2 * vol);
      out[i] = v;
    }
    return out;
  }
  const S0 = D.series;
  const BASE = {
    KRW: build(S0.KRW, 0.008, 1), JPY: build(S0.JPY, 0.012, 2), GBP: build(S0.GBP, 0.01, 3),
    DEM: build(S0.DEM, 0.01, 4), EURx: build(S0.EUR, 0.01, 5), OIL: build(S0.OIL, 0.04, 6), CPI: build(S0.CPI, 0, 7),
    RATE_KRW: build(S0.RATE_KRW, 0, 8), RATE_USD: build(S0.RATE_USD, 0, 9), RATE_JPY: build(S0.RATE_JPY, 0, 10)
  };
  // 유로 이전은 마르크를 유로 환산값으로 이어 붙임 (내부 계산은 끊김 없이)
  BASE.EUR = new Float64Array(LAST + 1).map((_, i) => i < EURO_START ? BASE.DEM[i] / DEM_PER_EUR : BASE.EURx[i]);
  // 실제 월별 값이 있으면 그걸 씀
  if (D.monthly) for (const k of Object.keys(D.monthly)) {
    const arr = D.monthly[k];
    if (arr) BASE[k] = Float64Array.from({ length: LAST + 1 }, (_, i) => arr[Math.min(i, arr.length - 1)]);
  }
  const VOL = { KRW: 0.022, JPY: 0.024, GBP: 0.02, EUR: 0.02, OIL: 0.07, CPI: 0, HKD: 0.002, CNY: 0.01, BRL: 0.04, ZAR: 0.035, THB: 0.02, INR: 0.015 };

  let S = null; // 게임 상태

  function series(key, i) {
    if (key === "USD") return 1;
    if (key === "AED") return 3.6725;
    if (i <= LAST) return BASE[key][Math.max(0, i)];
    // 현재 모드: 마지막 실제 값 이후 가상 연장
    const ext = S.ext[key] || (S.ext[key] = []);
    while (ext.length < i - LAST) {
      const prev = ext.length ? ext[ext.length - 1] : BASE[key][LAST];
      const drift = key === "CPI" ? 1.0025 : 1;
      ext.push(prev * drift * Math.exp((Math.random() - 0.5) * 2 * (VOL[key] ?? 0.02)));
    }
    return ext[i - LAST - 1];
  }
  // 1달러당 통화. 현재(실시간) 모드에서는 각 시장이 열릴 때 찍은 그날 환율(snap)을 씀
  const rate = (cur, i) => (S && S.rt && i === S.i && S.snap && S.snap[cur] != null) ? S.snap[cur] : series(cur, i);
  const oil = i => series("OIL", i);
  const cpi = i => series("CPI", i);
  // 천천히 따라가는 환율(현지 물가가 환율을 늦게 반영)
  function slow(key, i, a = 0.12, n = 30) {
    let w = 0, s = 0, f = 1;
    for (let k = 0; k < n; k++) { s += series(key, i - k) * f; w += f; f *= (1 - a); }
    return s / w;
  }
  // 유로 도시: 전환 전에는 옛 통화로 보여줌 (내부 값은 유로 환산으로 끊김 없이)
  const LEGACY = { EUR: ["DEM", 1.95583, "1999-01"], FRF: ["FRF", 6.55957, "1999-01"], ITL: ["ITL", 1936.27, "1999-01"], NLG: ["NLG", 2.20371, "1999-01"],
    BEF: ["BEF", 40.3399, "1999-01"], ESP: ["ESP", 166.386, "1999-01"], PTE: ["PTE", 200.482, "1999-01"], GRD: ["GRD", 340.75, "2001-01"] };
  const dispCur = (cur, i) => LEGACY[cur] ? (i < ym2i(LEGACY[cur][2]) ? LEGACY[cur][0] : "EUR") : cur;
  const dispMult = (cur, i) => LEGACY[cur] && i < ym2i(LEGACY[cur][2]) ? LEGACY[cur][1] : 1;
  const toDisp = (v, cur, i) => v * dispMult(cur, i);

  // ---------- 가격 ----------
  function valueUSD(gid, i) { const g = G[gid]; return g.base ? g.base(i) * cpi(i) / 258 : oil(i); }
  function modMult(mid, gid) {
    let x = 1;
    for (const md of S.mods) if ((md.m === "*" || md.m === mid) && (md.g === "*" || md.g === gid)) x *= md.x;
    return x;
  }
  function priceLocal(mid, gid, i = S.i) {
    const m = M[mid], g = G[gid];
    const factor = g.origin === mid ? 0.85 : Math.min(1.3, 1 + 0.06 * dist(g.origin, mid));
    const fxs = m.cur === "USD" || m.cur === "AED" ? rate(m.cur, i) : slow(m.cur, i);
    return valueUSD(gid, i) * fxs * factor * S.demand[mid][gid] * modMult(mid, gid);
  }
  const SPREAD = 0.01;
  function localToKRW(v, cur, i = S.i, dir = 1) {
    const krw = v / rate(cur, i) * rate("KRW", i);
    return cur === "KRW" ? krw : krw * (1 - dir * SPREAD);
  }
  const neg = mid => { const m = S.mgr && S.mgr[mid]; return m ? MG[m.id].neg * 0.008 : 0; };
  const buyKRW = (mid, gid) => localToKRW(priceLocal(mid, gid) * 1.03 * (1 - neg(mid)), M[mid].cur, S.i, -1);
  const sellKRW = (mid, gid) => localToKRW(priceLocal(mid, gid) * 0.97 * (1 + neg(mid)), M[mid].cur, S.i, 1);
  const scale = usd2020 => usd2020 * cpi(S.i) / 258 * rate("KRW", S.i); // 2020년 달러 → 지금 원화

  function freightKRW(gid, qty, from, to) {
    const of = Math.min(2.2, Math.max(0.7, oil(S.i) / slow("OIL", S.i, 0.08, 36)));
    return buyKRW(from, gid) * qty * 0.025 * dist(from, to) * of;
  }
  function routeDelay(a, b) {
    return S.delays.some(d => d.m === "*" || d.m === a || d.m === b) ? 1 : 0;
  }

  // ---------- 상태 ----------
  function blankDemand() { return Object.fromEntries(MARKETS.map(m => [m.id, Object.fromEntries(GOODS.map(g => [g.id, 1]))])); }
  function restockOne(m) {
    const others = GOODS.filter(g => g.id !== m.good && isOpen(g.origin, S.i)).sort(() => Math.random() - 0.5).slice(0, 3);
    S.stock[m.id] = Object.fromEntries(GOODS.map(g => [g.id, 0]));
    if (!isOpen(m.id, S.i)) return;
    S.stock[m.id][m.good] = 60;
    others.forEach(g => S.stock[m.id][g.id] = 15 + Math.floor(Math.random() * 10));
  }
  function restock() { S.stock = S.stock || {}; for (const m of MARKETS) restockOne(m); }
  function newGame(scId, carryUSDreal) {
    const sc = SCENARIOS.find(s => s.id === scId) || { id: "live", name: "현재 모드", from: D.last, to: null };
    const i = ym2i(sc.from);
    S = {
      v: 1, scen: sc.id, scenName: sc.name, live: sc.id === "live", i, startI: i,
      endI: sc.to ? ym2i(sc.to) : Infinity, ext: {}, mods: [], delays: [], voyages: [], nextId: 1,
      inv: Object.fromEntries(MARKETS.map(m => [m.id, {}])), cap: Object.fromEntries(MARKETS.map(m => [m.id, 60])),
      ships: 2, shipCap: 40, demand: blankDemand(), news: [], prevI: i - 1, over: false,
      mgr: {}, cb: Object.fromEntries(MARKETS.map(m => [m.id, {}])), traded: [], loans: {}
    };
    S.cash = carryUSDreal ? carryUSDreal * cpi(i) * rate("KRW", i) : scale(12000);
    S.startWorth = S.cash;
    restock();
    pushEvents(i, true);
    if (S.live) startLive();
    return S;
  }
  function invCount(mid) { return Object.values(S.inv[mid]).reduce((a, b) => a + b, 0); }
  function shipsFree() { return S.ships - S.voyages.length; }

  function netWorth() {
    let w = S.cash;
    for (const m of MARKETS) for (const [g, q] of Object.entries(S.inv[m.id])) w += q * sellKRW(m.id, g);
    for (const v of S.voyages) w += v.hedge != null ? v.hedge : v.qty * sellKRW(v.to, v.g);
    return w - debtKRW();
  }
  const grossAssets = () => netWorth() + debtKRW();

  // ---------- 은행 대출 ----------
  // 원화·달러·엔화로 빌릴 수 있음. 빚은 빌린 통화로 남아서, 환율이 오르면 원화로 갚을 돈이 늘어남.
  const LOAN_CURS = ["KRW", "USD", "JPY"];
  const LOAN_NAME = { KRW: "원화", USD: "달러", JPY: "엔화" };
  function loanRate(cur, i = S.i) {   // 연 %, 대출 금리(근사치)
    const k = "RATE_" + cur, arr = BASE[k];
    return arr[Math.min(Math.max(0, i), LAST)];
  }
  const toKRWraw = (amt, cur) => cur === "KRW" ? amt : amt / rate(cur, S.i) * rate("KRW", S.i);
  const fromKRWraw = (krw, cur) => cur === "KRW" ? krw : krw / rate("KRW", S.i) * rate(cur, S.i);
  function debtKRW() { let d = 0; for (const [cur, amt] of Object.entries(S.loans || {})) d += toKRWraw(amt, cur); return d; }
  const creditLimit = () => Math.max(0, grossAssets() * 0.6 - debtKRW());   // 총자산의 60%까지
  function borrow(cur, krw) {
    krw = Math.floor(krw);
    if (krw <= 0) return "금액을 정하세요";
    if (krw > creditLimit() + 1) return "대출 한도를 넘어요";
    S.loans = S.loans || {};
    const fee = cur === "KRW" ? 0 : krw * 0.005;   // 외화는 환전 수수료 0.5%
    S.loans[cur] = (S.loans[cur] || 0) + fromKRWraw(krw, cur);
    S.cash += krw - fee;
    return null;
  }
  function repay(cur, krw) {
    const owe = toKRWraw((S.loans || {})[cur] || 0, cur);
    if (owe <= 0) return "갚을 빚이 없어요";
    const fee = cur === "KRW" ? 1 : 1.005;
    krw = Math.min(Math.floor(krw), owe);
    if (krw * fee > S.cash + 1) return "현금이 부족해요";
    S.cash -= krw * fee;
    S.loans[cur] -= fromKRWraw(krw, cur);
    if (S.loans[cur] < 1e-6 || toKRWraw(S.loans[cur], cur) < 1) delete S.loans[cur];
    return null;
  }
  // 이자: frac = 1년 중 이번에 낼 몫 (월 단위 1/12, 실시간 하루 1/365). 현금이 모자라면 빚에 붙음
  function chargeInterest(i, frac) {
    let paidAll = 0, added = 0;
    for (const cur of Object.keys(S.loans || {})) {
      const intr = S.loans[cur] * loanRate(cur, i) / 100 * frac;
      const krw = toKRWraw(intr, cur);
      if (S.cash >= krw) { S.cash -= krw; paidAll += krw; }
      else { S.loans[cur] += intr; added += krw; }
    }
    if (added > 0 && frac > 0.05) S.news.unshift({ i, kind: "loan", title: "이자를 못 내 빚이 늘었어요", body: `현금이 모자라 이자 ${Math.round(added / 1e4).toLocaleString()}만원이 빚에 더해졌어요.` });
    // 부도: 빚이 총자산을 넘으면
    if (debtKRW() > 0 && netWorth() < 0 && !S.bankrupt) {
      S.bankrupt = true; S.over = true;
      S.news.unshift({ i, kind: "loss", title: "부도", body: "빚이 가진 재산보다 많아져 회사가 문을 닫았어요." });
    }
    return paidAll;
  }

  // ---------- 행동 ----------
  function buy(mid, gid, q) {
    q = Math.floor(q);
    const unit = buyKRW(mid, gid);
    if (q <= 0) return "수량을 정하세요";
    if (q > S.stock[mid][gid]) return "시장 재고가 부족해요";
    if (invCount(mid) + q > S.cap[mid]) return "창고가 가득 찼어요";
    if (unit * q > S.cash) return "돈이 부족해요";
    S.cash -= unit * q; S.stock[mid][gid] -= q;
    addInv(mid, gid, q, unit); markTraded(mid);
    return null;
  }
  function markTraded(mid) { S.traded = S.traded || []; if (!S.traded.includes(mid)) S.traded.push(mid); }
  function addInv(mid, gid, q, unitCost) {
    const have = S.inv[mid][gid] || 0, cb = S.cb[mid][gid] || unitCost;
    S.cb[mid][gid] = (cb * have + unitCost * q) / (have + q);
    S.inv[mid][gid] = have + q;
  }
  function takeInv(mid, gid, q) {
    S.inv[mid][gid] -= q;
    if (!S.inv[mid][gid]) { delete S.inv[mid][gid]; delete S.cb[mid][gid]; }
  }
  function sellCore(mid, gid, q) {
    const unit = sellKRW(mid, gid), profit = (unit - (S.cb[mid][gid] || unit)) * q;
    S.cash += unit * q; takeInv(mid, gid, q); markTraded(mid);
    return { revenue: unit * q, profit };
  }
  function sell(mid, gid, q) {
    q = Math.floor(q);
    if (q <= 0 || q > (S.inv[mid][gid] || 0)) return "보유 수량이 부족해요";
    sellCore(mid, gid, q);
    return null;
  }
  function quoteShip(from, to, gid, q, hedge, ins) {
    const turns = dist(from, to) + routeDelay(from, to);
    const freight = freightKRW(gid, q, from, to);
    const cargo = buyKRW(from, gid) * q;
    const insFee = ins ? cargo * 0.02 : 0;
    const expect = sellKRW(to, gid) * q;
    const hedgeVal = hedge ? expect * 0.97 : null;
    return { turns, freight, insFee, expect, hedgeVal, cost: freight + insFee, cargo };
  }
  function ship(from, to, gid, q, hedge, ins) {
    q = Math.floor(q);
    if (from === to) return "다른 항구를 고르세요";
    if (!isOpen(to, S.i)) return "아직 열리지 않은 항구예요";
    if (shipsFree() <= 0) return "쉬고 있는 배가 없어요";
    if (q <= 0 || q > (S.inv[from][gid] || 0)) return "창고 수량이 부족해요";
    if (q > S.shipCap) return `배 한 척에 ${S.shipCap}개까지 실을 수 있어요`;
    const qt = quoteShip(from, to, gid, q, hedge, ins);
    if (qt.cost > S.cash) return "운임을 낼 돈이 부족해요";
    S.cash -= qt.cost;
    const unitCost = (S.cb[from][gid] || buyKRW(from, gid)) + qt.cost / q;
    takeInv(from, gid, q);
    const v = { id: S.nextId++, g: gid, qty: q, qty0: q, from, to, dep: S.i, arrive: S.i + qt.turns, hedge: qt.hedgeVal, ins, insVal: qt.cargo, unitCost };
    if (S.rt) { v.depTs = S.now || Date.now(); v.arriveTs = v.depTs + qt.turns * DAY; }   // 현재 모드: 1턴 = 하루
    S.voyages.push(v);
    return null;
  }
  const UPG = {
    ship: { name: "화물선 1척 추가", usd: 30000 },
    hold: { name: "모든 배 적재량 +20", usd: 18000 },
    wh: { name: "이 항구 창고 +40칸", usd: 6000 }
  };
  const upgCost = k => scale(UPG[k].usd) * (k === "ship" ? Math.pow(1.4, S.ships - 2) : k === "hold" ? Math.pow(1.5, (S.shipCap - 40) / 20) : 1);
  function upgrade(k, mid) {
    const c = upgCost(k);
    if (c > S.cash) return "돈이 부족해요";
    S.cash -= c;
    if (k === "ship") S.ships++; else if (k === "hold") S.shipCap += 20; else S.cap[mid] += 40;
    return null;
  }

  // ---------- 한 달 진행 ----------
  function pushEvents(i, first) {
    for (const [d, title, body, fx] of D.events) {
      if (ym2i(d) !== i) continue;
      S.news.unshift({ i, kind: "history", title, body, fx });
      for (const e of fx) {
        if (e.k === "demand") S.mods.push({ m: e.m, g: e.g, x: e.x, until: i + e.n, why: title });
        if (e.k === "delay") S.delays.push({ m: e.m, until: i + e.n, why: title });
      }
    }
  }
  function arrive(v, i, out) {
    const g = G[v.g];
    if (v.hedge != null) {
      S.cash += v.hedge * (v.qty / (v.qty0 || v.qty));
      out.push({ v, val: v.hedge });
      S.news.unshift({ i, kind: "arrive", title: `${M[v.to].name} 도착 · 선물 정산`, body: `${g.name(i)} ${v.qty}개를 약속한 값에 팔았어요.` });
    } else {
      addInv(v.to, v.g, v.qty, (v.unitCost || sellKRW(v.to, v.g)) * (v.qty0 || v.qty) / Math.max(1, v.qty));
      out.push({ v });
      S.news.unshift({ i, kind: "arrive", title: `${M[v.to].name} 도착`, body: `${g.name(i)} ${v.qty}개가 창고에 들어왔어요.` });
    }
  }
  function nextTurn() {
    if (S.over) return;
    S.prevI = S.i; S.i++;
    const i = S.i, out = [];
    // 수요 변화(평균으로 돌아가는 랜덤 워크)
    for (const m of MARKETS) for (const g of GOODS) {
      let d = S.demand[m.id][g.id];
      d = Math.exp(Math.log(d) * 0.8 + (Math.random() - 0.5) * 0.16);
      S.demand[m.id][g.id] = Math.min(1.3, Math.max(0.75, d));
    }
    S.mods = S.mods.filter(x => x.until > i);
    S.delays = S.delays.filter(x => x.until > i);
    pushEvents(i);
    for (const m of MARKETS) if (m.from && ym2i(m.from) === i)
      S.news.unshift({ i, kind: "history", title: `${m.name} 항구 개방`, body: `${m.name} 시장이 외국 무역상에게 문을 열었어요. 특산품: ${G[m.good].name(i)}.` });
    // 관세 뉴스
    if (Math.random() < 0.025) {   // 관세 뉴스는 가끔만
      const m = MARKETS[Math.floor(Math.random() * MARKETS.length)];
      const cand = GOODS.filter(g => g.origin !== m.id);
      const g = cand[Math.floor(Math.random() * cand.length)];
      S.mods.push({ m: m.id, g: g.id, x: 0.8, until: i + 3, why: "관세" });
      S.news.unshift({ i, kind: "tariff", title: `${m.name}, ${g.name(i)} 관세 인상`, body: `앞으로 3개월간 ${m.name}에서 ${g.name(i)} 판매가가 20% 낮아져요.` });
    }
    // 항해
    const keep = [];
    for (const v of S.voyages) {
      const g = G[v.g];
      if (Math.random() < 0.03) {
        const pay = v.ins ? v.insVal * 0.9 : 0;
        S.cash += pay;
        S.news.unshift({ i, kind: "loss", title: `폭풍으로 ${g.name(i)} ${v.qty}개 유실`, body: v.ins ? `보험금 ${Math.round(pay).toLocaleString()}원을 받았어요.` : "보험이 없어 보상을 받지 못했어요." });
        continue;
      }
      if (g.perish) v.qty = Math.floor(v.qty * 0.95);
      if (i >= v.arrive) arrive(v, i, out); else keep.push(v);
    }
    S.voyages = keep;
    // 유통기한(곡물)
    for (const m of MARKETS) for (const g of GOODS) if (g.perish && S.inv[m.id][g.id]) {
      S.inv[m.id][g.id] = Math.floor(S.inv[m.id][g.id] * 0.95);
      if (!S.inv[m.id][g.id]) delete S.inv[m.id][g.id];
    }
    restock();
    runManagers(i);
    chargeInterest(i, 1 / 12);
    S.news = S.news.slice(0, 40);
    if (i >= S.endI) S.over = true;
    return out;
  }
  // ---------- 지점장 ----------
  const hireCost = id => scale(60 * statSum(MG[id]));
  const salary = id => scale(7 * statSum(MG[id]));
  const defaultSet = () => ({ buy: true, minEdge: 0.15, ship: true, sell: true, minProfit: 0.05, budget: 0.4 });
  function hire(id, mid) {
    if (!isOpen(mid, S.i)) return "아직 열리지 않은 항구예요";
    if (S.mgr[mid]) return "이 항구에는 이미 지점장이 있어요";
    if (Object.values(S.mgr).some(m => m.id === id)) return "다른 항구에서 일하고 있어요";
    const c = hireCost(id);
    if (c > S.cash) return "영입비가 부족해요";
    S.cash -= c;
    S.mgr[mid] = { id, set: defaultSet(), earned: 0 };
    return null;
  }
  function fire(mid) { delete S.mgr[mid]; return null; }
  function setMgr(mid, key, val) { if (S.mgr[mid]) S.mgr[mid].set[key] = val; }
  // 이 항구에서 사서 가장 비싸게 팔리는 곳: 운임까지 뺀 예상 차익
  function bestDest(mid, gid) {
    let best = null;
    const buy = buyKRW(mid, gid);
    for (const m of MARKETS) {
      if (m.id === mid || !isOpen(m.id, S.i)) continue;
      const net = sellKRW(m.id, gid) - freightKRW(gid, 1, mid, m.id);
      const edge = net / buy - 1;
      const turns = dist(mid, m.id) + routeDelay(mid, m.id);
      const score = edge / turns;   // 한 달당 수익률이 좋은 곳
      if (!best || score > best.score) best = { to: m.id, edge, score, turns };
    }
    return best;
  }
  function runManagers(i) { for (const mid of Object.keys(S.mgr)) runManager(mid, i, 1); }
  // payFrac: 월급 중 이번에 줄 몫 (현재 모드는 하루에 1/30씩)
  function runManager(mid, i, payFrac) {
    {
      const st = S.mgr[mid]; if (!st) return;
      const p = MG[st.id], set = st.set, m = M[mid], log = [];
      // 월급 (두 달 밀리면 그만둠)
      const due = salary(st.id) * payFrac, pay = Math.min(S.cash, due);
      S.cash -= pay;
      st.unpaid = pay < due ? (st.unpaid || 0) + payFrac : 0;
      if (st.unpaid >= 2) {
        delete S.mgr[mid];
        S.news.unshift({ i, kind: "manager", mgr: st.id, title: `${p.name} 퇴사`, body: `${m.name} 지점장이 월급을 두 달 못 받아 회사를 떠났어요.` });
        return;
      }
      // 1) 판매: 다른 나라에서 온 물건을 목표 이익 이상이면 팔기 (곡물은 상하기 전에)
      if (set.sell) for (const [gid, q] of Object.entries({ ...S.inv[mid] })) {
        if (gid === m.good) continue;
        const cb = S.cb[mid][gid] || 0, unit = sellKRW(mid, gid);
        if (unit >= cb * (1 + set.minProfit) || G[gid].perish) {
          const r = sellCore(mid, gid, q);
          const bonus = Math.max(0, r.profit) * 0.2;  // 성과급 20%
          S.cash -= bonus; st.earned += r.profit - bonus;
          log.push(`${G[gid].name(i)} ${q}개 판매 ${r.profit >= 0 ? "+" : ""}${Math.round(r.profit / 1e4).toLocaleString()}만원`);
        }
      }
      // 2) 매입: 특산품의 예상 차익이 기준 이상일 때만 (눈썰미가 낮으면 판단이 흔들림)
      const gid = m.good, bd = bestDest(mid, gid);
      if (set.buy && bd && shipsFree() > 0) {
        const seen = bd.edge + (Math.random() - 0.5) * 0.25 * (5 - p.eye) / 4;
        if (seen >= set.minEdge) {
          const unit = buyKRW(mid, gid);
          const room = S.shipCap - (S.inv[mid][gid] || 0);   // 배 한 척에 실을 만큼만
          const q = Math.floor(Math.min(10 * p.guts, room, S.stock[mid][gid], S.cap[mid] - invCount(mid), S.cash * set.budget / unit));
          if (q > 0) { buy(mid, gid, q); log.push(`${G[gid].name(i)} ${q}개 매입`); }
        }
      }
      // 3) 출항: 쉬는 배가 있으면 특산품을 가장 비싸게 팔리는 항구로
      if (set.ship && (S.inv[mid][gid] || 0) > 0 && shipsFree() > 0) {
        const b2 = bestDest(mid, gid);
        if (b2 && b2.edge > 0) {
          const q = Math.min(S.inv[mid][gid], S.shipCap);
          const err = ship(mid, b2.to, gid, q, false, p.guts < 4);
          if (!err) log.push(`${q}개 → ${M[b2.to].name} 출항${p.guts < 4 ? "(보험)" : ""}`);
        }
      }
      if (payFrac < 1 && !log.length) return;   // 현재 모드: 한 일이 있을 때만 보고
      S.news.unshift({ i, kind: "manager", mgr: st.id, title: `${p.name} · ${m.name} 지점 보고`, body: (log.length ? log.join(", ") : "이번 달은 지켜봤어요") + (payFrac < 1 ? "" : ` · 월급 ${Math.round(pay / 1e4).toLocaleString()}만원`) });
    }
  }

  // ---------- 현재 모드: 실제 시간과 시차 ----------
  // 각 시장은 매일 개장 시각(한국 시각)에 열리고, 그 순간 환율로 그날 시세가 고정됨.
  // 실제 일별 환율: window.LIVE_FX = { "2026-11-25": { KRW: 1337.2, JPY: 157.9, ... } } (AWS 서버가 만들어 줄 파일)
  // 없으면 마지막 실제 값에서 이어지는 가상 환율을 씀.
  const DAY = 864e5, KST = 9 * 36e5;
  const kstDay = ts => Math.floor((ts + KST) / DAY);
  const dayStr = d => new Date(d * DAY).toISOString().slice(0, 10);
  const monthIdx = ts => { const d = new Date(ts + KST); return (d.getUTCFullYear() - 1970) * 12 + d.getUTCMonth(); };
  const openTs = (m, d) => { const [h, mi] = m.open.split(":").map(Number); return d * DAY - KST + (h * 60 + mi) * 6e4; };
  const BASEDAY = kstDay(Date.UTC(D.last.slice(0, 4), +D.last.slice(5) - 1, 28));
  const dailyCache = {};
  // 그날 실제 값이 없으면(주말 등) 최근 10일 안의 실제 값을 씀
  function realOn(d) {
    const L = window.LIVE_FX; if (!L) return null;
    for (let k = 0; k < 10; k++) { const r = L[dayStr(d - k)]; if (r) return r; }
    return null;
  }
  const liveReal = (now = Date.now()) => !!realOn(kstDay(now));
  function dailyRate(cur, d) {
    if (cur === "USD") return 1;
    if (cur === "AED") return 3.6725;
    const real = realOn(d);
    if (real && real[cur]) return real[cur];
    const c = dailyCache[cur] || (dailyCache[cur] = [BASE[cur][LAST]]);
    const seed = cur.charCodeAt(0) * 131 + cur.charCodeAt(1) * 7 + cur.charCodeAt(2);
    while (c.length <= d - BASEDAY) {
      const k = c.length;
      c.push(c[k - 1] * Math.exp((hash(k, seed) - 0.5) * 2 * (VOL[cur] ?? 0.02) * 0.35));
    }
    return c[Math.max(0, d - BASEDAY)];
  }
  function lastOpenBefore(m, now) { let d = kstDay(now); while (openTs(m, d) > now) d--; return d; }
  function startLive(now = Date.now()) {
    S.live = true; S.rt = true; S.endI = Infinity; S.over = false;
    S.now = now; S.lastTs = now;
    S.i = Math.max(LAST + 1, monthIdx(now)); S.prevI = S.i - 1;
    S.snap = {}; S.prevSnap = {}; S.openAt = {};
    for (const m of MARKETS) {
      const d = lastOpenBefore(m, now);
      S.snap[m.cur] = dailyRate(m.cur, d); S.prevSnap[m.cur] = dailyRate(m.cur, d - 1);
      S.openAt[m.id] = openTs(m, d);
    }
    for (const v of S.voyages) if (!v.arriveTs) { v.depTs = now; v.arriveTs = now + Math.max(1, v.arrive - S.i) * DAY; }
    restock();
  }
  function monthTick(i) {
    S.mods = S.mods.filter(x => x.until > i);
    S.delays = S.delays.filter(x => x.until > i);
    for (const m of MARKETS) for (const g of GOODS) if (g.perish && S.inv[m.id][g.id]) {
      S.inv[m.id][g.id] = Math.floor(S.inv[m.id][g.id] * 0.95);
      if (!S.inv[m.id][g.id]) takeInv(m.id, g.id, 0);
    }
    if (Math.random() < 0.025) {
      const m = MARKETS[Math.floor(Math.random() * MARKETS.length)];
      const cand = GOODS.filter(g => g.origin !== m.id);
      const g = cand[Math.floor(Math.random() * cand.length)];
      S.mods.push({ m: m.id, g: g.id, x: 0.8, until: i + 3, why: "관세" });
      S.news.unshift({ i, kind: "tariff", title: `${m.name}, ${g.name(i)} 관세 인상`, body: `앞으로 3개월간 ${m.name}에서 ${g.name(i)} 판매가가 20% 낮아져요.` });
    }
  }
  // 마지막으로 본 때부터 지금까지 열린 시장들을 순서대로 처리 (자리를 오래 비웠으면 최근 2주만)
  function liveSync(now = Date.now()) {
    if (!S || !S.rt) return [];
    const out = [];
    let from = S.lastTs;
    if (now - from > 14 * DAY) from = now - 14 * DAY;
    const evs = [];
    for (let d = kstDay(from) - 1; d <= kstDay(now); d++) for (const m of MARKETS) {
      const t = openTs(m, d);
      if (t > from && t <= now) evs.push({ t, m, d });
    }
    evs.sort((a, b) => a.t - b.t);
    for (const { t, m, d } of evs) {
      S.now = t;
      const mi = Math.max(LAST + 1, monthIdx(t));
      if (mi > S.i) { S.prevI = S.i; S.i = mi; monthTick(mi); }
      S.prevSnap[m.cur] = S.snap[m.cur]; S.snap[m.cur] = dailyRate(m.cur, d); S.openAt[m.id] = t;
      for (const g of GOODS) {
        const v = Math.exp(Math.log(S.demand[m.id][g.id]) * 0.97 + (Math.random() - 0.5) * 0.05);
        S.demand[m.id][g.id] = Math.min(1.3, Math.max(0.75, v));
      }
      restockOne(m);
      const keep = [];
      for (const v of S.voyages) {
        if (m.id === "seoul" && Math.random() < 0.001) {   // 하루에 한 번 폭풍 확인
          const pay = v.ins ? v.insVal * 0.9 : 0; S.cash += pay;
          S.news.unshift({ i: S.i, kind: "loss", title: `폭풍으로 ${G[v.g].name(S.i)} ${v.qty}개 유실`, body: v.ins ? `보험금 ${Math.round(pay).toLocaleString()}원을 받았어요.` : "보험이 없어 보상을 받지 못했어요." });
          continue;
        }
        if (v.to === m.id && v.arriveTs <= t) arrive(v, S.i, out); else keep.push(v);
      }
      S.voyages = keep;
      if (S.mgr[m.id]) runManager(m.id, S.i, 1 / 30);
      if (m.id === "seoul") chargeInterest(S.i, 1 / 365);
    }
    S.now = now; S.lastTs = now;
    S.news = S.news.slice(0, 40);
    return out;
  }
  function nextOpen(now = Date.now()) {
    let best = null;
    for (const m of MARKETS) {
      if (!isOpen(m.id, S.i)) continue;
      let d = kstDay(now) - 1, t; while ((t = openTs(m, d)) <= now) d++;
      if (!best || t < best.t) best = { m, t };
    }
    return best;
  }
  const ratePrev = cur => S.rt ? (S.prevSnap[cur] ?? S.snap[cur]) : rate(cur, S.i - 1);
  // 예전 저장 파일 보정
  function migrate(s) {
    s.mgr = s.mgr || {};
    s.traded = s.traded || [];
    s.loans = s.loans || {};
    if (s.live && !s.rt && s.endI == null) s.endI = Infinity;
    s.cb = s.cb || {};
    for (const m of MARKETS) {
      s.cb[m.id] = s.cb[m.id] || {};
      s.inv[m.id] = s.inv[m.id] || {};
      s.cap[m.id] = s.cap[m.id] || 60;
      s.stock[m.id] = s.stock[m.id] || {};
      s.demand[m.id] = s.demand[m.id] || {};
      for (const g of GOODS) { if (s.demand[m.id][g.id] == null) s.demand[m.id][g.id] = 1; if (s.stock[m.id][g.id] == null) s.stock[m.id][g.id] = 0; }
    }
    return s;
  }

  // 시나리오가 끝난 뒤 자산을 물가 반영해 현재로 옮김
  function carryToLive() {
    const usdReal = netWorth() / rate("KRW", S.i) / cpi(S.i);
    return newGame("live", usdReal);
  }

  return {
    MARKETS, GOODS, M, G, SCENARIOS, LAST, ym2i, i2ym, dist, REGIONS, isOpen,
    get S() { return S; }, set S(v) { S = v ? migrate(v) : v; },
    MANAGERS, MG, statSum, hire, fire, setMgr, hireCost, salary, bestDest,
    newGame, nextTurn, carryToLive, buy, sell, ship, quoteShip, upgrade, upgCost, UPG,
    startLive, liveSync, nextOpen, ratePrev, DAY, liveReal,
    LOAN_CURS, LOAN_NAME, loanRate, debtKRW, creditLimit, borrow, repay, grossAssets,
    rate, oil, priceLocal, buyKRW, sellKRW, localToKRW, netWorth, invCount, shipsFree,
    dispCur, toDisp, dispMult, routeDelay
  };
})();
