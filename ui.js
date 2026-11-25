/* =====================================================================
   ui.js — 화면 그리기
   ※ 그래픽 작업 시: 클래스 추가 정도만. 함수 이름과 id는 그대로 두세요.
   ※ 그림은 assets/<이름>.png 를 먼저 찾고, 없으면 기본 도형을 그립니다.
   ===================================================================== */
{
  const $ = s => document.querySelector(s);
  const g = window.Game;
  const SAVE = "fxtrader.v1";
  let sel = "seoul";     // 선택한 항구
  let sheet = null;      // 열려 있는 거래 창 상태
  let moreOpen = false;  // "입고 없는 상품" 펼침 상태

  // ---------- 그림 자리(에셋) ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const asset = (name, fb, cls = "") =>
    `<span class="asset ${cls}" data-asset="${name}"><img src="assets/${name}.png" alt="" onerror="this.remove()">${fb}</span>`;
  const PORT_CODE = { newyork: "NY", london: "LDN", frankfurt: "FRA", dubai: "DXB", seoul: "SEL", tokyo: "TYO", shanghai: "SHA", hongkong: "HKG", bangkok: "BKK", singapore: "SIN", mumbai: "BOM", capetown: "CPT", zurich: "ZRH", saopaulo: "SAO", vancouver: "YVR", sydney: "SYD", taipei: "TPE", kualalumpur: "KUL", colombo: "CMB", paris: "PAR", rotterdam: "RTM", antwerp: "ANR", milan: "MIL", barcelona: "BCN", lisbon: "LIS", athens: "ATH", stockholm: "STO", oslo: "OSL", copenhagen: "CPH", losangeles: "LA", mexicocity: "MEX", auckland: "AKL" };
  const portFb = id => `<svg class="fb port-fb" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20"/><text x="20" y="24.5" text-anchor="middle">${PORT_CODE[id]}</text></svg>`;
  const GOOD_FB = {
    kr: i => i < g.ym2i("1990-01")
      ? `<path d="M11 6 4 10l3 6 3-2v13h12V14l3 2 3-6-7-4c-1 2-3 3-5 3s-4-1-5-3Z"/>`
      : `<rect x="8" y="8" width="16" height="16" rx="2"/><g stroke="currentColor" stroke-width="2"><path d="M12 4v4M16 4v4M20 4v4M12 24v4M16 24v4M20 24v4M4 12h4M4 16h4M4 20h4M24 12h4M24 16h4M24 20h4"/></g>`,
    jp: () => `<rect x="4" y="6" width="24" height="16" rx="2"/><rect x="7" y="9" width="18" height="10" fill="#fff" opacity=".35"/><path d="M12 26h8v2h-8z"/>`,
    oil: () => `<rect x="7" y="4" width="18" height="24" rx="4"/><g fill="#fff" opacity=".4"><rect x="7" y="10" width="18" height="2"/><rect x="7" y="20" width="18" height="2"/></g>`,
    de: () => `<path d="M14 3h4l1 4 3 1 3-3 3 3-3 3 1 3 4 1v4l-4 1-1 3 3 3-3 3-3-3-3 1-1 4h-4l-1-4-3-1-3 3-3-3 3-3-1-3-4-1v-4l4-1 1-3-3-3 3-3 3 3 3-1Z"/><circle cx="16" cy="16" r="4" fill="#fff" opacity=".5"/>`,
    uk: () => `<path d="M13 3h6v7c3 1 4 3 4 6v12H9V16c0-3 1-5 4-6Z"/><rect x="11" y="17" width="10" height="6" fill="#fff" opacity=".45"/>`,
    us: () => `<path d="M11 5h10l-2 4c5 2 8 7 8 12 0 5-4 7-11 7S5 26 5 21c0-5 3-10 8-12Z"/><path d="M13 9h6" stroke="#fff" stroke-width="2" opacity=".5"/>`
  };
  const crateFb = gid => `<rect x="4" y="7" width="24" height="20" rx="3"/><text x="16" y="21.5" font-size="11" font-weight="700" text-anchor="middle" fill="#fff">${g.G[gid].name(g.S.i)[0]}</text>`;
  const goodImg = (gid, cls = "") => asset(`good-${gid}`, `<svg class="fb g-${gid}" viewBox="0 0 32 32" fill="currentColor">${GOOD_FB[gid] ? GOOD_FB[gid](g.S.i) : crateFb(gid)}</svg>`, "contain " + cls);
  const shipLv = () => Math.min(3, 1 + Math.round((g.S.shipCap - 40) / 20));
  const shipImg = () => asset(`ship-lv${shipLv()}`, `<svg class="fb" viewBox="0 0 44 24"><path d="M2 14h40l-6 8H8Z" fill="#f26b38"/><rect x="10" y="7" width="8" height="7" fill="#f2b134"/><rect x="19" y="7" width="8" height="7" fill="#fff"/><rect x="28" y="4" width="5" height="10" fill="#e9f1f2"/></svg>`, "contain");
  const mgrImg = (id, cls = "") => asset(`manager-${id}`, `<svg class="fb" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#13505b"/><circle cx="20" cy="15" r="7" fill="#f2b134"/><path d="M7 36c2-8 7-12 13-12s11 4 13 12Z" fill="#f2b134"/></svg>`, "mgr " + cls);
  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
  const whLv = mid => Math.min(3, 1 + Math.round((g.S.cap[mid] - 60) / 40));

  // ---------- 숫자 표기 ----------
  function won(n) {
    n = Math.round(n); const a = Math.abs(n);
    if (a >= 1e8) return (n / 1e8).toFixed(a >= 1e10 ? 0 : 2) + "억원";
    if (a >= 1e5) return Math.round(n / 1e4).toLocaleString() + "만원";
    return n.toLocaleString() + "원";
  }
  const SYM = { KRW: "₩", JPY: "¥", USD: "$", GBP: "£", EUR: "€", DEM: "DM ", AED: "AED ", CNY: "CN¥", HKD: "HK$", SGD: "S$", THB: "฿", INR: "₹", AUD: "A$", CAD: "C$", BRL: "R$", ZAR: "R ", CHF: "CHF ", TWD: "NT$", MYR: "RM ", LKR: "Rs ", SEK: "kr ", NOK: "kr ", DKK: "kr ", MXN: "MX$", NZD: "NZ$", FRF: "F ", ITL: "L ", NLG: "ƒ ", BEF: "BF ", ESP: "Pta ", PTE: "Esc ", GRD: "Dr " };
  function local(v, cur) {
    const i = g.S.i, d = g.dispCur(cur, i), x = g.toDisp(v, cur, i);
    return SYM[d] + x.toLocaleString(undefined, { maximumFractionDigits: x >= 1000 ? 0 : 2, minimumFractionDigits: x >= 1000 ? 0 : 2 });
  }
  const pct = x => (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%";
  const cls = x => x > 0.0005 ? "up" : x < -0.0005 ? "down" : "";
  const ymText = i => { const d = g.i2ym(i); return `${d.y}년 ${d.m}월`; };
  const kst = ts => new Date(ts + 9 * 36e5);
  const hhmm = ts => kst(ts).toISOString().slice(11, 16);
  const kstText = ts => { const d = kst(ts); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${hhmm(ts)}`; };
  function leftText(ms) {
    if (ms <= 0) return "다음 개장 때 도착";
    const h = Math.ceil(ms / 36e5);
    return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간 후` : `${h}시간 후`;
  }
  // 원화 기준 환율 표기
  function fxLabel(cur, i) {
    if (cur === "KRW") return { txt: `$1 = ${Math.round(g.rate("KRW", i)).toLocaleString()}원`, v: g.rate("KRW", i) };
    const d0 = g.dispCur(cur, i);
    const unit = ["JPY", "INR", "LKR", "ITL", "ESP", "PTE", "GRD", "BEF"].includes(d0) ? 100 : 1;
    const d = g.dispCur(cur, i);
    const v = g.rate("KRW", i) / g.rate(cur, i) * unit / g.dispMult(cur, i);
    const name = { JPY: "100엔", USD: "1달러", GBP: "1파운드", EUR: "1유로", DEM: "1마르크", AED: "1디르함", CNY: "1위안", HKD: "1홍콩달러", SGD: "1싱가포르달러", THB: "1바트", INR: "100루피", AUD: "1호주달러", CAD: "1캐나다달러", BRL: "1헤알", ZAR: "1랜드", CHF: "1스위스프랑",
      TWD: "1대만달러", MYR: "1링깃", LKR: "100스리랑카루피", SEK: "1스웨덴크로나", NOK: "1노르웨이크로네", DKK: "1덴마크크로네", MXN: "1페소", NZD: "1뉴질랜드달러",
      FRF: "1프랑", ITL: "100리라", NLG: "1길더", BEF: "100벨기에프랑", ESP: "100페세타", PTE: "100에스쿠도", GRD: "100드라크마" }[d];
    return { txt: `${name} = ${Math.round(v).toLocaleString()}원`, v };
  }
  function fxChange(cur) {
    const S = g.S, a = cur === "KRW" ? g.rate("KRW", S.i) : g.rate("KRW", S.i) / g.rate(cur, S.i);
    const pk = S.rt ? g.ratePrev("KRW") : g.rate("KRW", S.i - 1), pc = S.rt ? g.ratePrev(cur) : g.rate(cur, S.i - 1);
    const b = cur === "KRW" ? pk : pk / pc;
    return a / b - 1;
  }

  // ---------- 저장 ----------
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(g.S)); } catch (e) {} };
  const load = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s && s.v === 1) { if (s.over === undefined) s.over = false; if (s.endI === null) s.endI = Infinity; return s; } } catch (e) {} return null; };

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2200);
  }

  // ---------- 상단 ----------
  function renderTop() {
    const S = g.S, w = g.netWorth(), r = w / S.startWorth - 1;
    const d = g.i2ym(S.i);
    const era = S.rt || S.i > g.LAST ? "live" : (Math.floor(d.y / 10) * 10) + "s";
    document.documentElement.dataset.era = era;   // 시대별 분위기: CSS에서 [data-era="1970s"] 로 꾸미기
    $("#scen").textContent = S.scenName;
    if (S.rt) {
      const no = g.nextOpen();
      $("#date").innerHTML = `${kstText(Date.now())}<small>${g.liveReal() ? "실제 환율" : "가상 환율"} · 다음 개장 ${no ? `${no.m.name} ${hhmm(no.t)}` : "-"}</small>`;
      $("#btnNext").textContent = no ? `${no.m.name} ${hhmm(no.t)} 개장 · 새로고침` : "새로고침";
    } else {
      $("#date").innerHTML = `${ymText(S.i)}<small>${S.live ? "현재 모드" : `목표 ×${Story.target(S.scen)} · 남은 ${S.endI - S.i}개월`}</small>`;
      $("#btnNext").textContent = "다음 달 ▶";
    }
    $("#cash").textContent = won(S.cash);
    const debt = g.debtKRW();
    $("#debtStat").hidden = debt < 1;
    $("#debt").textContent = won(debt);
    $("#worth").textContent = won(w);
    const ret = $("#ret"); ret.textContent = pct(r); ret.className = "num " + cls(r);
  }

  // ---------- 환율 그래프 (원화로 본 그 나라 돈, 최근 24개월) ----------
  function fxSeries(cur, i, n = 24) {
    const out = [];
    for (let k = Math.max(0, i - n + 1); k <= i; k++) out.push(cur === "KRW" ? g.rate("KRW", k) : g.rate("KRW", k) / g.rate(cur, k) / g.dispMult(cur, i));
    return out;
  }
  function fxChart(cur) {
    const S = g.S, ys = fxSeries(cur, S.i), n = ys.length;
    if (n < 3) return "";
    const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || hi * 0.01;
    const X = k => (k / (n - 1)) * 100, Y = v => 34 - ((v - lo) / span) * 30;
    const line = ys.map((v, k) => `${k ? "L" : "M"}${X(k).toFixed(2)},${Y(v).toFixed(2)}`).join("");
    const unit = ["JPY", "INR", "LKR", "ITL", "ESP", "PTE", "GRD", "BEF"].includes(g.dispCur(cur, S.i)) ? 100 : 1, last = ys[n - 1], first = ys[0];
    const chg = last / first - 1, pos = (last - lo) / span;
    const fmt = v => Math.round(v * (cur === "KRW" ? 1 : unit)).toLocaleString() + "원";
    const verdict = pos > 0.8 ? "2년 중 비싼 편" : pos < 0.2 ? "2년 중 싼 편" : "2년 중 중간쯤";
    return `<div class="fxchart">
      <div class="fxc-head"><b>${cur === "KRW" ? "1달러" : fxLabel(cur, S.i).txt.split(" =")[0]}의 원화 값 · 최근 ${n}개월</b>
        <span class="num ${cls(chg)}">${pct(chg)}</span></div>
      <div class="fxc-plot"><svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
        <path class="fxc-area" d="${line}L100,36L0,36Z"/>
        <path class="fxc-line ${cls(chg)}" d="${line}"/>
      </svg><span class="fxc-pt" style="top:${(Y(last) / 36 * 100).toFixed(1)}%"></span></div>
      <div class="fxc-foot num"><span>최저 ${fmt(lo)}</span><b>지금 ${fmt(last)} · ${verdict}</b><span>최고 ${fmt(hi)}</span></div>
    </div>`;
  }

  // ---------- 세계 항로도 ----------
  // 지도 좌표: x = 경도 + 180, y = 72 - 위도 (map.js 와 같은 기준)
  const mapEl = $("#map"), svg = $("#world");
  const XY = m => ({ x: m.lon + 180, y: 72 - m.lat });
  let region = "all", vb = null, anim = null;
  function regionBox(r) {
    if (r === "all") return { x: 0, y: -6, w: 360, h: 128 };
    const pts = g.MARKETS.filter(m => m.region === r).map(XY);
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const ext = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const pad = Math.max(3.5, Math.min(9, ext * 0.3));
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
  }
  function fitAspect(b) {   // 지도 칸 비율에 맞게 넓힘
    const W = mapEl.clientWidth || 360, H = mapEl.clientHeight || 200, a = W / H;
    let { x, y, w, h } = b;
    if (w / h < a) { const nw = h * a; x -= (nw - w) / 2; w = nw; } else { const nh = w / a; y -= (nh - h) / 2; h = nh; }
    return { x, y, w, h };
  }
  function zoomTo(r, instant) {
    region = r;
    const to = fitAspect(regionBox(r)), from = vb || to;
    cancelAnimationFrame(anim);
    const t0 = performance.now(), dur = instant || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - (1 - k) ** 3;
      vb = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
      svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      if (k < 1) anim = requestAnimationFrame(step); else drawMapLayer();
    };
    anim = requestAnimationFrame(step);
    $("#mapAll").hidden = r === "all";
    renderRegions();
    if (g.S) renderCities();
  }
  function drawMapLayer() {
    const S = g.S, b = fitAspect(regionBox(region)), u = b.w / 100;   // u: 화면 너비의 1%
    const r = u * 1.25, fs = u * 3.4;   // 확대해도 화면에서 같은 크기
    const grat = [];
    for (let lon = -150; lon <= 180; lon += 30) grat.push(`M${lon + 180},-60V200`);
    for (let lat = 60; lat >= -60; lat -= 30) grat.push(`M-400,${72 - lat}H800`);
    const routes = [], ships = [];
    for (const v of S.voyages) {
      const a = XY(g.M[v.from]), c = XY(g.M[v.to]);
      let bx = c.x; if (bx - a.x > 180) bx -= 360; if (a.x - bx > 180) bx += 360;
      const mx = (a.x + bx) / 2, my = Math.min(a.y, c.y) - Math.min(25, Math.abs(bx - a.x) * 0.22);
      routes.push(`<path class="route" d="M${a.x},${a.y} Q${mx},${my} ${bx},${c.y}" style="stroke-width:${u * 0.35}"/>`);
      const prog = S.rt ? (Date.now() - v.depTs) / Math.max(1, v.arriveTs - v.depTs) : (S.i - v.dep + 0.5) / (v.arrive - v.dep);
      const t = Math.min(0.85, Math.max(0.15, prog));
      const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * bx, y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * c.y;
      const sw = u * 7, sh = sw / 2, flip = bx < a.x ? ` transform="translate(${x * 2},0) scale(-1,1)"` : "";
      ships.push(`<g class="mship"${flip}><image href="assets/ship-lv${shipLv()}.png" x="${x - sw / 2}" y="${y - sh / 2}" width="${sw}" height="${sh}"/></g>`);
    }
    // 이름표 자리 잡기: 위 → 아래 → 오른쪽 → 왼쪽 중 다른 이름·점과 안 겹치는 곳
    const placed = [], labels = {};
    const dots = g.MARKETS.map(m => { const p = XY(m); return { x0: p.x - r, x1: p.x + r, y0: p.y - r, y1: p.y + r, id: m.id }; });
    const hit = (b, skip) => placed.some(q => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0) ||
      dots.some(q => q.id !== skip && b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
    const order = [...g.MARKETS].sort((a, b) => (b.id === sel) - (a.id === sel));
    for (const m of order) {
      if (region === "all" && m.id !== sel) continue;
      const p = XY(m), w = m.name.length * fs * 0.98, h = fs * 1.05, on = m.id === sel;
      const cands = [
        { x: p.x, y: p.y - r * 1.9, a: "middle", b: { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - r * 1.9 - h, y1: p.y - r * 1.9 } },
        { x: p.x, y: p.y + r * 1.9 + h * 0.8, a: "middle", b: { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y + r * 1.9, y1: p.y + r * 1.9 + h } },
        { x: p.x + r * 1.7, y: p.y + h * 0.35, a: "start", b: { x0: p.x + r * 1.7, x1: p.x + r * 1.7 + w, y0: p.y - h / 2, y1: p.y + h / 2 } },
        { x: p.x - r * 1.7, y: p.y + h * 0.35, a: "end", b: { x0: p.x - r * 1.7 - w, x1: p.x - r * 1.7, y0: p.y - h / 2, y1: p.y + h / 2 } }
      ];
      if (m.below) cands.unshift(cands.splice(1, 1)[0]);
      const c = cands.find(c => !hit(c.b, m.id)) || (on ? cands[0] : null);
      if (c) { placed.push(c.b); labels[m.id] = c; }
    }
    const cities = g.MARKETS.map(m => {
      const p = XY(m), open = g.isOpen(m.id, S.i), on = m.id === sel;
      const ch = open ? fxChange(m.cur) : 0;
      const L = labels[m.id];
      return `<g class="mcity ${on ? "on" : ""} ${open ? "" : "closed"}" data-port="${m.id}" role="button" aria-label="${m.name}">
        <circle class="hit" cx="${p.x}" cy="${p.y}" r="${r * 3}"/>
        ${on ? `<circle class="ring" cx="${p.x}" cy="${p.y}" r="${r * 2}" style="stroke-width:${r * 0.5}"/>` : ""}
        <circle class="dot ${open ? cls(ch) : ""}" cx="${p.x}" cy="${p.y}" r="${on ? r * 1.25 : r}" style="stroke-width:${r * 0.35}"/>
        ${L ? `<text x="${L.x}" y="${L.y}" font-size="${fs}" text-anchor="${L.a}" style="stroke-width:${fs * 0.28}">${m.name}</text>` : ""}
      </g>`;
    }).join("");
    svg.innerHTML = `<rect class="sea" x="-400" y="-200" width="1200" height="600"/>
      <path class="grat" d="${grat.join("")}" style="stroke-width:${u * 0.12}"/>
      <path class="land" d="${window.WORLD_LAND}" style="stroke-width:${u * 0.12}"/>
      ${routes.join("")}${cities}${ships.join("")}`;
  }
  function renderRegions() {
    $("#regions").innerHTML = g.REGIONS.map(r => `<button type="button" class="rtab ${r.id === region ? "on" : ""}" data-region="${r.id}">${r.name}</button>`).join("");
  }
  function renderCities() {
    const S = g.S;
    $("#cities").innerHTML = g.MARKETS.filter(m => region === "all" || m.region === region).map(m => {
      const open = g.isOpen(m.id, S.i), ch = open ? fxChange(m.cur) : 0;
      const tag = m.id === "seoul" ? `$${Math.round(g.rate("KRW", S.i))}` : open ? pct(ch) : `${m.from.slice(0, 4)}년 개방`;
      return `<button type="button" class="citychip ${m.id === sel ? "on" : ""} ${open ? "" : "closed"}" data-port="${m.id}">
        <b>${m.name}</b><small class="num ${open && m.id !== "seoul" ? cls(ch) : ""}">${tag}</small></button>`;
    }).join("");
    const on = $("#cities .on");
    if (on) { const c = $("#cities"); c.scrollTo({ left: on.offsetLeft - c.clientWidth / 2 + on.clientWidth / 2, behavior: "smooth" }); }
  }
  function renderMap() {
    if (!vb) zoomTo(region, true);
    drawMapLayer(); renderCities();
  }
  function pickCity(id) {
    sel = id;
    const r = g.M[id].region;
    if (region !== r && region !== "all") zoomTo(r); else if (region === "all") zoomTo(r); else drawMapLayer();
    renderCities(); renderMarket();
  }

  // ---------- 시장 ----------
  function renderMarket() {
    const S = g.S, m = g.M[sel], fx = fxLabel(m.cur, S.i), ch = fxChange(m.cur);
    if (!g.isOpen(sel, S.i)) {
      $("#market").innerHTML = `<div class="mhead">${asset("port-" + sel, portFb(sel))}<div><h2>${m.name}</h2>
        <div class="meta"><span>아직 외국 무역상에게 열리지 않았어요 · ${m.from.slice(0, 4)}년 ${+m.from.slice(5)}월 개방</span></div></div></div>
        <p class="empty">개방되면 특산품 ${g.G[m.good].name(S.i)}을(를) 살 수 있어요.</p>`;
      return;
    }
    const used = g.invCount(sel);
    const mods = S.mods.filter(x => x.m === "*" || x.m === sel);
    const delayed = S.delays.some(x => x.m === "*" || x.m === sel);
    const chips = [
      ...mods.map(x => `<span class="chip">${esc(x.why === "관세" ? "관세" : x.why)} · ${x.g === "*" ? "전 품목" : g.G[x.g].name(S.i)} ${x.x > 1 ? "+" : ""}${Math.round((x.x - 1) * 100)}%</span>`),
      delayed ? `<span class="chip">항로 지연 +1달</span>` : "",
      g.dispCur(m.cur, S.i) !== m.cur && g.dispCur(m.cur, S.i) !== "EUR" ? `<span class="chip info">${m.id === "athens" ? 2001 : 1999}년 유로로 전환 예정</span>` : ""
    ].join("");
    // 초보 도우미: 여기서 사서 어디에 팔면 남는지 (운임까지 뺀 예상)
    const tipFor = (gid, stock, have) => {
      if (stock) {
        const bd = g.bestDest(sel, gid);
        return bd && bd.edge > 0.03 ? `<span class="tip up">→ ${g.M[bd.to].name}에 팔면 약 +${Math.round(bd.edge * 100)}% (${bd.turns}${S.rt ? "일" : "달"})</span>`
          : `<span class="tip">→ 지금은 옮겨도 남는 곳이 없어요</span>`;
      }
      if (have) {
        const p = g.sellKRW(sel, gid) / (S.cb[sel][gid] || 1) - 1;
        return `<span class="tip ${cls(p)}">여기서 팔면 평단 대비 ${pct(p)}</span>`;
      }
      return "";
    };
    const rowFor = gd => {
      const stock = S.stock[sel][gd.id], have = S.inv[sel][gd.id] || 0;
      const b = g.buyKRW(sel, gd.id), s = g.sellKRW(sel, gd.id);
      return `<button class="good ${stock ? "" : "soldout"}" data-good="${gd.id}" type="button">
        ${goodImg(gd.id)}
        <span><span class="gname">${gd.name(S.i)}</span>${gd.origin === sel ? `<span class="tag">특산</span>` : ""}
          <span class="sub" style="display:block">시장 재고 ${stock} · 내 창고 ${have}${have ? ` · 평단 ${won(S.cb[sel][gd.id] || 0)}` : ""}</span>${tipFor(gd.id, stock, have)}</span>
        <span class="px">${stock ? `살 때 <b>${won(b)}</b><br>` : `<span class="muted">이번 달 입고 없음</span><br>`}팔 때 <b class="${have ? cls(s / (S.cb[sel][gd.id] || s) - 1) : ""}">${won(s)}</b></span>
      </button>`;
    };
    // 살 수 있거나 가진 상품만 먼저, 나머지는 접어 둠
    const main = g.GOODS.filter(gd => S.stock[sel][gd.id] || S.inv[sel][gd.id]);
    const rest = g.GOODS.filter(gd => !S.stock[sel][gd.id] && !S.inv[sel][gd.id] && g.isOpen(gd.origin, S.i));
    const rows = main.map(rowFor).join("") + (rest.length ? `<details class="more" ${moreOpen ? "open" : ""}><summary>입고 없는 상품 ${rest.length}개 · 팔 때 값 보기</summary><div class="goods">${rest.map(rowFor).join("")}</div></details>` : "");
    $("#market").innerHTML = `
      <div class="mhead">${asset("port-" + sel, portFb(sel))}
        <div><h2>${m.name}</h2>
          <div class="meta"><span class="num">${fx.txt} <span class="${cls(ch)}">${pct(ch)}</span></span>
          ${S.rt ? `<span>오늘 시세: ${hhmm(S.openAt[sel])} 개장 때 환율로 고정</span>` : ""}
          <span>${asset(`warehouse-lv${whLv(sel)}`, `<svg class="fb" viewBox="0 0 20 20"><path d="M2 8 10 3l8 5v10H2Z" fill="#f2b134"/><rect x="6" y="11" width="8" height="7" fill="#0f4c5c"/></svg>`, "contain wh")} 창고 ${used}/${S.cap[sel]}칸</span><span>개장 한국 ${m.open}</span></div></div></div>
      ${fxChart(m.cur)}
      ${chips ? `<div class="chips">${chips}</div>` : ""}
      ${mgrSlot()}
      <div class="goods">${rows}</div>`;
  }

  // ---------- 지점장 ----------
  function mgrSlot() {
    const st = g.S.mgr[sel];
    if (!st) return `<button class="mslot empty-slot" data-mgr-open type="button">
      <span class="mslot-plus">+</span><span class="mslot-txt"><b>지점장 없음</b><small>영입하면 매달 알아서 사고, 보내고, 팔아요</small></span></button>`;
    const p = g.MG[st.id];
    return `<button class="mslot" data-mgr-open type="button">${mgrImg(p.id)}
      <span class="mslot-txt"><b>${p.name} <small>지점장</small></b><small>협상 ${p.neg} · 눈썰미 ${p.eye} · 배짱 ${p.guts} · 누적 ${won(st.earned)}</small></span>
      <span class="mslot-go">설정</span></button>`;
  }
  function openMgr() {
    const S = g.S, st = S.mgr[sel], m = g.M[sel];
    sheet = { mgr: true };
    if (!st) {
      const busy = Object.fromEntries(Object.entries(S.mgr).map(([mid, x]) => [x.id, mid]));
      const hired = Object.keys(S.mgr).length;
      $("#sheetCard").innerHTML = `
        <div class="sheet-head"><div><h2 style="margin:0">${m.name} 지점장 영입</h2><small>현금 ${won(S.cash)} · 배 ${S.ships}척 · 지점장 ${hired}명</small></div>
          <button class="xbtn" data-close type="button" aria-label="닫기">×</button></div>
        <p class="note" style="margin:0 0 12px">지점장은 매달 이 항구 특산품을 사서 쉬는 배로 보내고, 들어온 물건은 목표 이익이 나면 팔아요. 배 1척에 지점장 1~2명이 알맞아요. 너무 많이 뽑으면 배가 모자라 월급만 나가요.</p>
        <div class="mlist">${g.MANAGERS.map(p => {
          const where = busy[p.id];
          return `<div class="mcard">${mgrImg(p.id, "big")}
            <div class="mbody"><b>${p.name}</b><small>${p.from}</small>
              <div class="mstats"><span>협상 <i>${stars(p.neg)}</i></span><span>눈썰미 <i>${stars(p.eye)}</i></span><span>배짱 <i>${stars(p.guts)}</i></span></div>
              <small class="num">영입비 ${won(g.hireCost(p.id))} · 월급 ${won(g.salary(p.id))} + 성과급 20%</small>
              ${where ? `<span class="badge">${g.M[where].name} 근무 중</span>` : `<button class="btn primary" data-hire="${p.id}" type="button">영입</button>`}
            </div></div>`;
        }).join("")}</div>
        <p class="note">협상: 이 항구 거래가가 1단계당 0.8% 유리해져요. 눈썰미: 살 때 판단이 정확해요. 배짱: 한 달에 다루는 물량이 커지고, 4 이상이면 보험 없이 보내요.</p>`;
    } else {
      const p = g.MG[st.id], set = st.set;
      const opt = (key, vals, fmt) => `<div class="seg">${vals.map(v => `<button type="button" class="${set[key] === v ? "on" : ""}" data-set="${key}" data-val="${v}">${fmt(v)}</button>`).join("")}</div>`;
      const sw = (key, label, desc) => `<label class="toggle"><input type="checkbox" data-mset="${key}" ${set[key] ? "checked" : ""}><span><b>${label}</b><small>${desc}</small></span></label>`;
      $("#sheetCard").innerHTML = `
        <div class="sheet-head">${mgrImg(p.id)}<div><h2 style="margin:0">${p.name}</h2><small>${m.name} 지점장 · 누적 수익 ${won(st.earned)} · 월급 ${won(g.salary(p.id))}</small></div>
          <button class="xbtn" data-close type="button" aria-label="닫기">×</button></div>
        <div class="toggles">
          ${sw("buy", `${g.G[m.good].name(S.i)} 자동 매입`, "쉬는 배가 있고 예상 차익이 기준 이상일 때만 사요.")}
        </div>
        <small class="muted">살 때 최소 예상 차익 (운임 뺀 값)</small>
        ${opt("minEdge", [0.05, 0.15, 0.3], v => Math.round(v * 100) + "%")}
        <small class="muted">한 달에 쓸 수 있는 현금 비율</small>
        ${opt("budget", [0.2, 0.4, 0.6], v => Math.round(v * 100) + "%")}
        <div class="toggles" style="margin-top:12px">
          ${sw("ship", "자동 출항", "한 달당 수익률이 가장 좋은 항구로 보내요.")}
          ${sw("sell", "들어온 물건 자동 판매", "평단가보다 목표만큼 비싸면 팔아요. 곡물은 상하기 전에 팔아요.")}
        </div>
        <small class="muted">팔 때 목표 이익</small>
        ${opt("minProfit", [0, 0.05, 0.15], v => Math.round(v * 100) + "%")}
        <button class="btn" data-fire type="button" style="width:100%;margin-top:16px">해고하기</button>`;
    }
    $("#sheet").hidden = false;
  }

  // ---------- 뉴스·선단 ----------
  function renderNews() {
    const S = g.S, list = S.news.slice(0, 6);
    $("#news").innerHTML = `<h2>뉴스</h2>` + (list.length ? list.map(n =>
      `<div class="newsitem ${n.kind} ${n.i === S.i ? "fresh" : ""}">${n.mgr ? mgrImg(n.mgr, "news-face") : ""}<span class="when">${ymText(n.i)}</span><b>${esc(n.title)}</b><p>${esc(n.body)}</p></div>`).join("")
      : `<p class="empty">아직 조용한 달이에요. 항구를 눌러 물건을 사고, 다른 항구로 보내보세요.</p>`);
  }
  function renderFleet() {
    const S = g.S;
    const rows = S.voyages.map(v => {
      const left = v.arrive - S.i;
      return `<div class="voy">${goodImg(v.g)}<span><b>${g.G[v.g].name(S.i)} ${v.qty}개</b><br><small>${g.M[v.from].name} → ${g.M[v.to].name}</small>
        ${v.hedge != null ? `<span class="badge">선물</span>` : ""}${v.ins ? `<span class="badge">보험</span>` : ""}</span>
        <span class="num">${S.rt ? leftText(v.arriveTs - Date.now()) : left <= 1 ? "다음 달 도착" : left + "달 후"}</span></div>`;
    }).join("");
    $("#fleet").innerHTML = `<h2>선단 <small class="num">${g.shipsFree()}/${S.ships}척 대기 · 척당 ${S.shipCap}개</small></h2>` +
      (rows || `<p class="empty">항해 중인 배가 없어요.</p>`);
  }
  function renderAll() { renderTop(); renderMap(); renderMarket(); renderNews(); renderFleet(); Story.refocus(); }

  // ---------- 거래 창 ----------
  function openSheet(gid) { sheet = { gid, q: 1, dest: null, hedge: false, ins: false }; $("#sheet").hidden = false; renderSheet(); Story.ev("openGood"); }
  function closeSheet() { $("#sheet").hidden = true; sheet = null; Story.refocus(); }
  function renderSheet() {
    if (!sheet) return;
    const S = g.S, gid = sheet.gid, gd = g.G[gid], m = g.M[sel];
    const have = S.inv[sel][gid] || 0, stock = S.stock[sel][gid];
    const bL = g.priceLocal(sel, gid) * 1.03, sL = g.priceLocal(sel, gid) * 0.97;
    const rec0 = g.bestDest(sel, gid), rec = rec0 && rec0.edge > 0.03 ? rec0 : null;
    const dests = g.MARKETS.filter(x => x.id !== sel && g.isOpen(x.id, S.i)).sort((a, b) => g.sellKRW(b.id, gid) - g.sellKRW(a.id, gid)).map(x => {
      const t = g.dist(sel, x.id) + g.routeDelay(sel, x.id);
      return `<button class="dest ${sheet.dest === x.id ? "on" : ""}" data-dest="${x.id}" type="button"><b>${x.name}${rec && rec.to === x.id ? ` <span class="badge">추천</span>` : ""}</b><small>팔 때 ${won(g.sellKRW(x.id, gid))} · ${t}${g.S.rt ? "일" : "달"}</small></button>`;
    }).join("");
    let quote = "";
    if (sheet.dest && have) {
      const q = Math.min(sheet.q, have, S.shipCap);
      const qt = g.quoteShip(sel, sheet.dest, gid, q, sheet.hedge, sheet.ins);
      const basis = g.buyKRW(sel, gid) * q;
      const income = qt.hedgeVal != null ? qt.hedgeVal : qt.expect;
      const profit = income - qt.cost - basis;
      quote = `<div class="quote">
        <div><span>싣는 수량</span><span class="num">${q}개</span></div>
        <div><span>운임 (유가 반영)</span><span class="num">${won(qt.freight)}</span></div>
        ${sheet.ins ? `<div><span>보험료 2%</span><span class="num">${won(qt.insFee)}</span></div>` : ""}
        <div><span>${qt.hedgeVal != null ? "확정 매출 (선물 수수료 3% 뺌)" : "예상 매출 (지금 시세)"}</span><span class="num">${won(income)}</span></div>
        <div class="total"><span>지금 이 항구 시세 대비 예상 이익</span><span class="num ${cls(profit)}">${won(profit)}</span></div></div>`;
    }
    $("#sheetCard").innerHTML = `
      <div class="sheet-head">${goodImg(gid)}<div><h2 style="margin:0">${gd.name(S.i)} · ${m.name}</h2><small>시장 재고 ${stock} · 내 창고 ${have} · 현금 ${won(S.cash)}</small></div>
        <button class="xbtn" data-close type="button" aria-label="닫기">×</button></div>
      <div class="row2">
        <div class="kv"><span>살 때 (현지가 ${local(bL, m.cur)})</span><b>${won(g.buyKRW(sel, gid))}</b></div>
        <div class="kv"><span>팔 때 (현지가 ${local(sL, m.cur)})</span><b>${won(g.sellKRW(sel, gid))}</b></div>
      </div>
      <p class="note" style="margin:-6px 0 10px">같은 항구에서 사고 바로 팔면 시장 수수료(약 6~8%)만큼 손해예요. 더 비싸게 팔리는 다른 항구로 옮겨야 남아요.${rec ? ` <b>추천: ${g.M[rec.to].name} 약 +${Math.round(rec.edge * 100)}%</b>` : ""}</p>
      <label for="qty" class="muted" style="font-size:14px">수량</label>
      <div class="stepper">
        <button data-q="-10" type="button">−10</button><button data-q="-1" type="button">−1</button>
        <input id="qty" type="number" inputmode="numeric" min="1" value="${sheet.q}">
        <button data-q="1" type="button">+1</button><button data-q="10" type="button">+10</button>
        <button class="max" data-q="max" type="button">최대</button>
      </div>
      <div class="acts">
        <button class="btn primary" data-act="buy" type="button" ${stock ? "" : "disabled"}>사기</button>
        <button class="btn" data-act="sell" type="button" ${have ? "" : "disabled"}>팔기</button>
      </div>
      <div class="sec">
        <h2>다른 항구로 보내기</h2>
        ${have ? `<div class="dests">${dests}</div>
        <div class="toggles">
          <label class="toggle"><input type="checkbox" data-tg="hedge" ${sheet.hedge ? "checked" : ""}><span><b>선물 계약</b><small>도착했을 때 받을 원화를 지금 시세로 확정해요. 수수료 3%. 도착하면 자동으로 팔려요.</small></span></label>
          <label class="toggle"><input type="checkbox" data-tg="ins" ${sheet.ins ? "checked" : ""}><span><b>화물 보험</b><small>화물값의 2%. 폭풍으로 잃으면 90%를 돌려받아요.</small></span></label>
        </div>${quote}
        <button class="btn primary" data-act="ship" type="button" style="width:100%;max-width:none" ${sheet.dest ? "" : "disabled"}>출항</button>`
        : `<p class="empty">이 항구 창고에 ${gd.name(S.i)}이(가) 있어야 보낼 수 있어요.</p>`}
      </div>`;
    Story.refocus();
  }
  function maxQty(act) {
    const S = g.S, gid = sheet.gid;
    if (act === "sell") return S.inv[sel][gid] || 0;
    const byCash = Math.floor(S.cash / g.buyKRW(sel, gid));
    return Math.max(1, Math.min(S.stock[sel][gid], S.cap[sel] - g.invCount(sel), byCash));
  }
  function act(a) {
    const S = g.S, gid = sheet.gid, q = sheet.q;
    const cbBefore = S.cb[sel][gid] || 0, sellUnit = g.sellKRW(sel, gid), hedged = sheet.hedge;
    let err = null;
    if (a === "buy") err = g.buy(sel, gid, q);
    if (a === "sell") err = g.sell(sel, gid, Math.min(q, S.inv[sel][gid] || 0));
    if (a === "ship") err = g.ship(sel, sheet.dest, gid, Math.min(q, S.inv[sel][gid] || 0, S.shipCap), sheet.hedge, sheet.ins);
    if (err) { Extras.play("bad"); return toast(err); }
    toast(a === "buy" ? "샀어요" : a === "sell" ? "팔았어요" : "출항했어요");
    if (a === "buy") Extras.play("buy");
    if (a === "sell") { Extras.play("coin"); if (sellUnit > cbBefore) Extras.unlock("profit1"); }
    if (a === "ship") { Extras.play("horn"); Extras.unlock("ship1"); if (hedged) Extras.unlock("hedge1"); }
    Extras.check(g);
    save(); renderAll();
    if (a === "ship") closeSheet(); else renderSheet();
    Story.ev(a);
  }

  // ---------- 투자 창 ----------
  function openUpg() {
    const S = g.S;
    const item = (k, extra) => `<div class="toggle" style="justify-content:space-between;align-items:center">
      <span><b>${g.UPG[k].name}</b><small>${extra}</small></span>
      <button class="btn" data-upg="${k}" type="button">${won(g.upgCost(k))}</button></div>`;
    sheet = { upg: true };
    $("#sheetCard").innerHTML = `
      <div class="sheet-head">${shipImg()}<div><h2 style="margin:0">투자·대출</h2><small>현금 ${won(S.cash)}${g.debtKRW() > 0 ? ` · 빚 ${won(g.debtKRW())}` : ""}</small></div>
        <button class="xbtn" data-close type="button" aria-label="닫기">×</button></div>
      <div class="toggles">
        ${item("ship", `지금 ${S.ships}척. 동시에 더 많은 항로를 굴려요.`)}
        ${item("hold", `지금 척당 ${S.shipCap}개. 한 번에 더 많이 실어요.`)}
        ${item("wh", `${g.M[sel].name} 창고 ${S.cap[sel]}칸 → ${S.cap[sel] + 40}칸`)}
      </div>
      <h2 style="margin-top:6px">은행 대출</h2>
      <p class="note" style="margin:0 0 8px">총자산의 60%까지 빌릴 수 있어요. 남은 한도 <b class="num">${won(g.creditLimit())}</b>. 이자는 ${S.rt ? "매일" : "매달"} 현금에서 나가고, 모자라면 빚에 붙어요. <b>달러·엔화로 빌리면 이자는 싸지만, 원화 값이 떨어질 때 갚을 돈이 불어나요.</b> 빚이 재산보다 많아지면 부도예요.</p>
      <div class="loans">${g.LOAN_CURS.map(cur => {
        const owe = S.loans[cur] || 0, oweKRW = cur === "KRW" ? owe : owe / g.rate(cur, S.i) * g.rate("KRW", S.i);
        return `<div class="loan">
          <div class="loan-head"><b>${g.LOAN_NAME[cur]} 대출</b><span class="num">연 ${g.loanRate(cur).toFixed(1)}%</span></div>
          <small>${owe > 0 ? `빚 ${cur === "KRW" ? won(owe) : local(owe, cur)}${cur === "KRW" ? "" : ` (지금 원화로 ${won(oweKRW)})`}` : "빌린 돈 없음"}</small>
          <div class="loan-btns">
            ${[0.1, 0.25, 0.5].map(f => `<button class="btn" type="button" data-borrow="${cur}" data-f="${f}" ${g.creditLimit() < 1e4 ? "disabled" : ""}>${Math.round(f * 100)}% 빌리기</button>`).join("")}
            ${owe > 0 ? `<button class="btn" type="button" data-repay="${cur}" data-f="0.5">절반 갚기</button><button class="btn primary" type="button" data-repay="${cur}" data-f="1">다 갚기</button>` : ""}
          </div></div>`;
      }).join("")}</div>
      <p class="note">지점장은 시장 화면의 "지점장" 칸에서 영입해요. 금리는 그 시대 실제 대출 금리 수준(근사치)이에요.</p>`;
    $("#sheet").hidden = false;
  }

  // ---------- 시작·결과 ----------
  function openStart() {
    const saved = load();
    $("#modalCard").innerHTML = `
      <div class="startHead">${Story.guideImg()}<div><h2>시곗바늘을 어느 시대에 멈출까?</h2>
      <p class="lead">각 시대에서 목표만큼 재산을 불리면 다음 시대로 가는 문이 열려요. 2020년대를 넘으면 원래 시간으로 돌아가요.</p></div></div>
      <div class="scens">
        ${saved && !saved.over ? `<button class="scenbtn cont" data-cont type="button"><b>이어하기</b><small>${esc(saved.scenName)} · ${ymText(saved.i)}</small></button>` : ""}
        ${`<button class="scenbtn live" data-scen="live" type="button"><b>지금 이 순간</b><small>실시간 현재 모드 · 도시마다 현지 아침에 시장이 열려요</small></button>`}
        ${g.SCENARIOS.map(s => `<button class="scenbtn" data-scen="${s.id}" type="button"><b>${s.name}</b><small>${s.sub} · 목표 ×${Story.target(s.id)}${Extras.R.best[s.id] ? ` · 최고 ×${Extras.R.best[s.id].toFixed(1)}${Extras.R.best[s.id] >= Story.target(s.id) ? " 달성" : ""}` : ""}</small></button>`).join("")}
      </div>
      <div class="row3">
        <button class="btn ghost" data-ach type="button">업적 ${Object.keys(Extras.R.ach).length}/${Extras.ACH.length}</button>
        <button class="btn ghost" data-sound type="button">소리 ${Extras.R.sound ? "켜짐" : "꺼짐"}</button>
        <button class="btn ghost" data-tutreplay type="button">튜토리얼</button>
      </div>
      <div class="row2b">
        <button class="btn ghost" data-transfer type="button">저장 옮기기</button>
        <button class="btn ghost" data-invite type="button">친구에게 게임 보내기</button>
      </div>
      <p class="note">환율은 미국 연준 월평균, 유가는 WTI 월평균 실제 값이에요(원화 1981년 이전·유가 1985년 이전은 당시 고시 가격 근사치). 2026년 10월 이후는 가상으로 이어져요.</p>`;
    $("#modal").hidden = false;
  }
  function openAch() {
    $("#modalCard").innerHTML = `<h2>업적</h2>
      <div class="achlist">${Extras.ACH.map(a => `<div class="ach ${Extras.R.ach[a.id] ? "done" : ""}"><b>${a.name}</b><small>${a.desc}</small></div>`).join("")}</div>
      <button class="btn primary" data-menu type="button" style="width:100%;max-width:none;margin-top:12px">돌아가기</button>`;
    $("#modal").hidden = false;
  }
  function openEnd() {
    const S = g.S, w = g.netWorth(), r = w / S.startWorth - 1;
    const tg = Story.target(S.scen) || 1, cleared = !S.bankrupt && w >= S.startWorth * tg;
    Extras.scenarioEnd(S.scen, w / S.startWorth, cleared);
    const k = g.SCENARIOS.findIndex(x => x.id === S.scen), next = g.SCENARIOS[k + 1];
    let btns;
    if (cleared && next) btns = `<button class="scenbtn cont" data-scen="${next.id}" type="button"><b>다음 시대로: ${next.name}</b><small>${next.sub}</small></button>
        <button class="scenbtn" data-live type="button"><b>현재로 바로 가기</b><small>물가를 반영해 자산을 오늘 가치로 옮겨요</small></button>`;
    else if (cleared) btns = `<button class="scenbtn cont" data-live type="button"><b>원래 시간으로 돌아가기</b><small>지금 자산 그대로 현재 모드를 이어가요</small></button>`;
    else btns = `<button class="scenbtn cont" data-scen="${S.scen}" type="button"><b>다시 도전</b><small>${esc(S.scenName)}을 처음부터</small></button>
        <button class="scenbtn" data-menu type="button"><b>다른 시대 고르기</b><small>시나리오 목록</small></button>`;
    $("#modalCard").innerHTML = `
      <div class="startHead">${Story.guideImg()}<div><h2>${S.bankrupt ? "부도" : cleared ? "목표 달성!" : "목표에 못 미쳤어요"}</h2>
      <p class="lead">${S.bankrupt ? "빚이 재산보다 많아져 회사 문을 닫았네. 빚은 칼날 같아서, 잘 쓰면 무기지만 잘못 쥐면 자기를 베지. 다시 감아 보겠나?" : Story.endLines(S, cleared)}</p></div></div>
      <div class="row2">
        <div class="kv"><span>시작 자산</span><b>${won(S.startWorth)}</b></div>
        <div class="kv"><span>최종 순자산 (목표 ×${tg})</span><b>${won(w)}</b></div>
      </div>
      <div class="result ${cls(r)}">×${(w / S.startWorth).toFixed(2)}</div>
      <div class="scens">${btns}</div>
      <button class="btn ghost" data-brag type="button" style="width:100%;margin-top:6px">결과 자랑하기</button>`;
    $("#modal").hidden = false;
  }

  // ---------- 공유 ----------
  const GAME_URL = location.hostname.endsWith("github.io") ? location.origin + location.pathname : "https://catle110511-dotcom.github.io/fx-trader-/";
  async function shareText(text) {
    try { if (navigator.share) { await navigator.share({ title: "환율 무역상", text, url: GAME_URL }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text + "\n" + GAME_URL); toast("복사했어요. 카톡 등에 붙여넣으세요"); }
    catch (e) { showCopyBox(text + "\n" + GAME_URL); }
  }
  function brag() {
    const S = g.S, m = g.netWorth() / S.startWorth, tg = Story.target(S.scen);
    const ok = !S.bankrupt && tg && m >= tg;
    shareText(S.bankrupt ? `환율 무역상 ${S.scenName}에서 빚 때문에 부도났어… 나보다 잘할 수 있어?`
      : `환율 무역상 ${S.scenName}: 재산 ${m.toFixed(1)}배${tg ? ` (목표 ${tg}배 ${ok ? "달성!" : "실패"})` : ""}. 실제 환율로 장사하는 게임, 너도 해봐!`);
  }
  // 복사가 막힌 기기용: 직접 길게 눌러 복사
  function showCopyBox(text) {
    $("#modalCard").innerHTML = `<h2>직접 복사하기</h2><p class="lead">아래 글을 길게 눌러 복사하세요.</p>
      <textarea class="codebox" readonly>${esc(text)}</textarea>
      <button class="btn primary" data-menu type="button" style="width:100%;max-width:none;margin-top:10px">돌아가기</button>`;
    $("#modal").hidden = false;
  }

  // ---------- 저장 옮기기 (폰 ↔ PC) ----------
  async function packSave() {
    const data = JSON.stringify({ v: 1, S: g.S, story: Story.flags, rec: Extras.R });
    const bytes = new TextEncoder().encode(data);
    try {
      const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
      const buf = new Uint8Array(await new Response(cs).arrayBuffer());
      let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return "FXT1Z:" + btoa(bin);
    } catch (e) {
      let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return "FXT1:" + btoa(bin);
    }
  }
  async function unpackSave(code) {
    code = code.trim();
    const z = code.startsWith("FXT1Z:"), body = code.replace(/^FXT1Z?:/, "");
    const bin = atob(body), bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    let text;
    if (z) text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    else text = new TextDecoder().decode(bytes);
    const d = JSON.parse(text);
    if (!d || d.v !== 1 || !d.S) throw new Error("bad");
    return d;
  }
  async function openTransfer() {
    $("#modalCard").innerHTML = `<h2>저장 옮기기</h2>
      <p class="lead">이 기기의 게임을 다른 기기(폰 ↔ PC)로 옮겨요. 아래 코드를 복사해서 다른 기기의 같은 화면에 붙여넣으세요.</p>
      <b class="mini">1. 이 기기의 저장 코드</b>
      <textarea class="codebox" id="myCode" readonly>만드는 중…</textarea>
      <button class="btn" data-copycode type="button" style="width:100%;margin:6px 0 14px">코드 복사</button>
      <b class="mini">2. 다른 기기에서 받은 코드 붙여넣기</b>
      <textarea class="codebox" id="inCode" placeholder="FXT1로 시작하는 코드를 붙여넣으세요"></textarea>
      <button class="btn primary" data-loadcode type="button" style="width:100%;max-width:none;margin-top:6px">불러오기 (지금 게임은 덮어써요)</button>
      <button class="btn ghost" data-menu type="button" style="width:100%;margin-top:8px">돌아가기</button>`;
    $("#modal").hidden = false;
    try { $("#myCode").value = g.S ? await packSave() : "아직 저장된 게임이 없어요"; } catch (e) { $("#myCode").value = "코드를 만들지 못했어요"; }
  }

  // ---------- 속보 카드 ----------
  function fxText(e) {
    const where = e.m === "*" ? "모든 항구" : g.M[e.m].name;
    if (e.k === "delay") return `${where} 항로 +1달 지연 · ${e.n}개월`;
    const what = e.g === "*" ? "전 품목" : g.G[e.g].name(g.S.i);
    return `${where} ${what} ${e.x > 1 ? "+" : ""}${Math.round((e.x - 1) * 100)}% · ${e.n}개월`;
  }
  function showFlash(list) {
    const S = g.S, era = document.documentElement.dataset.era;
    const old = era === "1970s" || era === "1980s";
    let el = $("#flash");
    if (!el) { el = document.createElement("div"); el.id = "flash"; el.className = "flash"; document.body.appendChild(el); }
    el.innerHTML = `<div class="flash-card ${old ? "paper" : ""}">
      <div class="flash-head"><span>${old ? "호외" : "속보"}</span><b class="num">${ymText(S.i)}</b></div>
      ${list.map(n => `<h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>
        ${(n.fx || []).length ? `<div class="chips">${n.fx.map(e => `<span class="chip">${esc(fxText(e))}</span>`).join("")}</div>` : ""}`).join("<hr>")}
      <button class="btn primary" data-flash-close type="button" style="width:100%;max-width:none">확인</button></div>`;
    el.hidden = false;
  }

  // ---------- 이벤트 ----------
  document.addEventListener("click", e => {
    const t = e.target.closest("button, [data-close], [data-port]"); if (!t) return;
    if (t.hasAttribute("data-flash-close")) { $("#flash").hidden = true; return; }
    if (t.dataset.port) { pickCity(t.dataset.port); Story.ev("port", sel); return; }
    if (t.dataset.region) { zoomTo(t.dataset.region); return; }
    if (t.id === "mapAll") { zoomTo("all"); return; }
    if (t.dataset.good) return openSheet(t.dataset.good);
    if (t.hasAttribute("data-close")) return closeSheet();
    if (t.dataset.q && sheet) {
      sheet.q = t.dataset.q === "max" ? maxQty((g.S.inv[sel][sheet.gid] || 0) && !g.S.stock[sel][sheet.gid] ? "sell" : "buy") : Math.max(1, sheet.q + +t.dataset.q);
      return renderSheet();
    }
    if (t.dataset.dest && sheet) { sheet.dest = t.dataset.dest; return renderSheet(); }
    if (t.dataset.act && sheet) return act(t.dataset.act);
    if (t.hasAttribute("data-mgr-open")) return openMgr();
    if (t.dataset.hire) { const err = g.hire(+t.dataset.hire, sel); toast(err || "영입했어요"); if (!err) { Extras.play("coin"); Extras.check(g); } save(); renderAll(); return err ? null : openMgr(); }
    if (t.hasAttribute("data-fire")) { g.fire(sel); toast("해고했어요"); save(); closeSheet(); return renderAll(); }
    if (t.dataset.set) { g.setMgr(sel, t.dataset.set, +t.dataset.val); save(); return openMgr(); }
    if (t.dataset.upg) { const err = g.upgrade(t.dataset.upg, sel); toast(err || "투자 완료"); if (!err) Extras.play("coin"); Extras.check(g); save(); renderAll(); return openUpg(); }
    if (t.dataset.borrow) { const err = g.borrow(t.dataset.borrow, g.creditLimit() * +t.dataset.f); toast(err || "빌렸어요"); if (!err) Extras.play("coin"); save(); renderAll(); return openUpg(); }
    if (t.dataset.repay) {
      const cur = t.dataset.repay, owe = g.S.loans[cur] || 0, oweKRW = cur === "KRW" ? owe : owe / g.rate(cur, g.S.i) * g.rate("KRW", g.S.i);
      const err = g.repay(cur, oweKRW * +t.dataset.f + (+t.dataset.f === 1 ? 1 : 0)); toast(err || "갚았어요"); save(); renderAll(); return openUpg();
    }
    if (t.hasAttribute("data-ach")) return openAch();
    if (t.hasAttribute("data-transfer")) { openTransfer(); return; }
    if (t.hasAttribute("data-invite")) { shareText("실제 환율이랑 역사 사건(오일쇼크, IMF…)으로 장사하는 게임 만들었어. 해봐!"); return; }
    if (t.hasAttribute("data-brag")) { brag(); return; }
    if (t.hasAttribute("data-copycode")) {
      const v = $("#myCode").value;
      navigator.clipboard.writeText(v).then(() => toast("복사했어요"), () => { $("#myCode").select(); toast("길게 눌러 복사하세요"); });
      return;
    }
    if (t.hasAttribute("data-loadcode")) {
      unpackSave($("#inCode").value).then(d => {
        g.S = d.S;
        try { localStorage.setItem("fxtrader.story", JSON.stringify(d.story || {})); localStorage.setItem("fxtrader.records", JSON.stringify(d.rec || {})); } catch (e) {}
        save(); $("#modal").hidden = true; renderAll(); toast("불러왔어요");
      }).catch(() => toast("코드가 올바르지 않아요"));
      return;
    }
    if (t.hasAttribute("data-sound")) { const on = Extras.toggleSound(); toast(on ? "소리 켬" : "소리 끔"); return openStart(); }
    if (t.dataset.scen) { g.newGame(t.dataset.scen); sel = "seoul"; save(); $("#modal").hidden = true; renderAll(); return Story.startScenario(t.dataset.scen); }
    if (t.hasAttribute("data-tutreplay")) { Story.replayTutorial(); return toast("다음에 시대를 고르면 튜토리얼이 시작돼요"); }
    if (t.hasAttribute("data-cont")) { g.S = load(); $("#modal").hidden = true; return renderAll(); }
    if (t.hasAttribute("data-live")) {
      if (g.S.scen === "20s") { g.S.scenName = "현재 모드"; g.startLive(); }
      else g.carryToLive();
      save(); $("#modal").hidden = true; renderAll(); return Story.sayLive();
    }
    if (t.hasAttribute("data-menu")) return openStart();
  });
  document.addEventListener("toggle", e => { if (e.target.classList && e.target.classList.contains("more")) moreOpen = e.target.open; }, true);
  document.addEventListener("change", e => {
    if (!sheet) return;
    if (e.target.id === "qty") { sheet.q = Math.max(1, Math.floor(+e.target.value || 1)); renderSheet(); }
    if (e.target.dataset.tg) { sheet[e.target.dataset.tg] = e.target.checked; renderSheet(); }
    if (e.target.dataset.mset) { g.setMgr(sel, e.target.dataset.mset, e.target.checked); save(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
  function liveRefresh(manual) {
    const before = g.S.lastTs;
    const arrivals = g.liveSync();
    const fresh = g.S.news.filter(n => n.kind !== "tariff" && n.i === g.S.i).length;
    save(); renderAll(); Extras.check(g);
    if (manual) toast(arrivals.length ? `배 ${arrivals.length}척 도착` : "최신 시세예요");
    if (arrivals.length) Extras.play("horn");
    return before;
  }
  setInterval(() => { if (g.S && g.S.rt && $("#sheet").hidden && $("#modal").hidden) liveRefresh(false); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && g.S && g.S.rt) liveRefresh(false); });
  $("#btnNext").addEventListener("click", () => {
    if (g.S.rt) { liveRefresh(true); if (g.S.bankrupt) openEnd(); return; }
    if (g.S.over) return openEnd();
    const arrivals = g.nextTurn(); save(); renderAll();
    Extras.play("next"); Extras.check(g);
    if (g.S.news.some(n => n.i === g.S.i && n.kind === "loss")) Extras.play("bad");
    Story.ev("next", arrivals);
    const fresh = g.S.news.filter(n => n.i === g.S.i && n.kind === "history");
    if (fresh.length && !g.S.over) { showFlash(fresh); Extras.play("news"); }
    if (g.S.over) setTimeout(openEnd, 400);
  });
  $("#btnUpg").addEventListener("click", openUpg);
  $("#btnMenu").addEventListener("click", openStart);
  const ro = new ResizeObserver(() => { if (g.S) { vb = null; zoomTo(region, true); drawMapLayer(); } }); ro.observe(mapEl);

  window.UI = { showRegion: r => zoomTo(r) };   // 튜토리얼이 지도를 움직일 때 씀
  // ---------- 홈 화면 앱 ----------
  try { if ("serviceWorker" in navigator && location.protocol === "https:" && location.hostname.endsWith("github.io")) navigator.serviceWorker.register("sw.js"); } catch (e) {}

  // ---------- 시작 ----------
  Extras.onUnlock = a => setTimeout(() => toast(`업적 달성: ${a.name}`), 900);
  const saved = load();
  if (saved) { g.S = saved; renderAll(); if (saved.over) openEnd(); }
  else {
    g.newGame("90s"); renderAll();
    if (!Story.flags.prologue) Story.prologue(openStart); else openStart();
  }
}
