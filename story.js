/* =====================================================================
   story.js — 주인공 이야기, 시계방 노인의 안내, 튜토리얼
   ※ 대사는 이 파일에서 고치면 됩니다. 그림: assets/hero.png, guide.png, story-1~4.png
   ===================================================================== */
window.Story = (() => {
  const KEY = "fxtrader.story";
  let flags = {};
  try { flags = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const saveFlags = () => { try { localStorage.setItem(KEY, JSON.stringify(flags)); } catch (e) {} };
  const $ = s => document.querySelector(s);

  const GUIDE = "시계방 노인";
  const asset = (name, fb, cls = "") =>
    `<span class="asset ${cls}"><img src="assets/${name}.png" alt="" onerror="this.remove()">${fb}</span>`;
  const guideFb = `<svg class="fb" viewBox="0 0 60 60"><rect width="60" height="60" rx="12" fill="#3e2818"/><circle cx="30" cy="24" r="11" fill="#e8c9a0"/><path d="M19 22c2-9 20-9 22 0" fill="#d9d4cc"/><circle cx="25" cy="24" r="3" fill="none" stroke="#2b1d00" stroke-width="1.5"/><circle cx="35" cy="24" r="3" fill="none" stroke="#2b1d00" stroke-width="1.5"/><path d="M10 58c3-14 11-20 20-20s17 6 20 20Z" fill="#6b4a2f"/><circle cx="30" cy="48" r="4" fill="#d99b26"/></svg>`;
  const heroFb = `<svg class="fb" viewBox="0 0 60 60"><rect width="60" height="60" rx="12" fill="#13505b"/><circle cx="30" cy="24" r="11" fill="#f0d2b0"/><path d="M19 22c1-10 21-10 22 0-6-3-15-3-22 0Z" fill="#1f2b33"/><path d="M10 58c3-14 11-20 20-20s17 6 20 20Z" fill="#e76f3c"/></svg>`;
  const guideImg = (cls = "") => asset("guide", guideFb, "face " + cls);
  const heroImg = (cls = "") => asset("hero", heroFb, "face " + cls);
  const sceneFb = n => `<svg class="fb" viewBox="0 0 320 180"><defs><linearGradient id="sk${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${["#2c3e50", "#3e2818", "#c98c24", "#236d82"][n - 1]}"/><stop offset="1" stop-color="#0c3840"/></linearGradient></defs><rect width="320" height="180" fill="url(#sk${n})"/><rect y="130" width="320" height="50" fill="#0c3840"/><circle cx="160" cy="80" r="${[0, 34, 0, 0][n - 1]}" fill="#d99b26" opacity=".8"/></svg>`;

  // ---------- 프롤로그 ----------
  const PROLOGUE = [
    { img: 1, who: null, text: "2026년 겨울, 부산. 환율이 한 달 사이 크게 요동쳤고, 당신의 작은 무역회사는 그 파도를 넘지 못했다." },
    { img: 2, who: null, text: "빈 사무실을 정리하고 나오던 밤. 항구 골목 끝, 처음 보는 시계방 하나가 불을 밝히고 있었다." },
    { img: 2, who: "guide", text: "환율에 졌다고? 허허. 그럼 환율을 아는 사람이 되면 되지. 이걸 가져가게." },
    { img: 3, who: null, text: "노인이 건넨 회중시계에는 숫자 대신 세계의 항구 여섯 곳이 새겨져 있었다. 태엽을 감자, 바늘이 거꾸로 돌기 시작했다." },
    { img: 3, who: "guide", text: "돌아오고 싶으면 그 시대의 파도를 넘어 재산을 불려 오게. 목표를 채우면 다음 시대로 가는 문이 열릴 걸세." },
    { img: 4, who: "hero", text: "…여긴 어디지? 주머니엔 시계와 약간의 돈, 그리고 낡은 화물선 두 척의 열쇠. 미래의 기억만은 그대로다." }
  ];
  function prologue(done) {
    let k = 0;
    const el = document.createElement("div");
    el.className = "story"; el.id = "story";
    document.body.appendChild(el);
    const draw = () => {
      const p = PROLOGUE[k];
      el.innerHTML = `<div class="story-card">
        <div class="story-img">${asset("story-" + p.img, sceneFb(p.img))}</div>
        <div class="story-text">${p.who ? `<div class="story-who">${p.who === "guide" ? guideImg() : heroImg()}<b>${p.who === "guide" ? GUIDE : "나"}</b></div>` : ""}<p>${p.text}</p></div>
        <div class="story-nav"><button class="btn ghost" data-st="skip" type="button">건너뛰기</button>
          <span class="story-dots">${PROLOGUE.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span>
          <button class="btn primary" data-st="next" type="button">${k === PROLOGUE.length - 1 ? "시대 고르기" : "다음"}</button></div></div>`;
    };
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-st]"); if (!b) return;
      if (b.dataset.st === "next" && k < PROLOGUE.length - 1) { k++; return draw(); }
      el.remove(); flags.prologue = true; saveFlags(); done && done();
    });
    draw();
  }

  // ---------- 시대별 목표와 대사 ----------
  const TARGET = { "70s": 3, "80s": 4, "90s": 6, "00s": 4, "10s": 4, "20s": 3.5 };
  const ERA = {
    "70s": ["1973년 봄이군. 세상이 이제 막 고정된 환율을 내려놓았어. 지금은 기름이 물보다 싸지만… 사막 너머에서 부는 바람을 조심하게.", "자네 나라 원화는 아직 나라가 값을 정해 두고 있네. 평소엔 잠잠하다가, 한 번 움직이면 크게 움직이지."],
    "80s": ["1980년. 달러가 하늘 높은 줄 모르고 치솟는 시대야. 하지만 너무 높이 오른 것은 언젠가 여럿이 힘을 합쳐 끌어내리기 마련이지.", "88년 가을엔 서울에 세계의 손님이 몰려올 걸세."],
    "90s": ["1990년. 걸프의 모래바람이 먼저 불 테고… 1997년 겨울엔 자네 나라에 혹독한 추위가 올 걸세. 추위는 누군가에겐 기회가 되지.", "그리고 세기말엔 유럽의 돈들이 하나로 합쳐질 걸세."],
    "00s": ["2000년. 축구공 하나가 서울과 도쿄를 들뜨게 할 테고, 2008년 가을엔 월가에서 큰 집 하나가 무너질 걸세.", "기름값이 끝없이 오르는 것처럼 보여도, 끝은 늘 갑자기 오지."],
    "10s": ["2010년. 바다 건너 섬나라에 큰 땅울림이 있을 걸세. 기름값은 오르다 반 토막이 나고, 섬나라 하나는 유럽을 떠나겠다고 하겠지.", "조용한 시대일수록 작은 차이를 꾸준히 모으는 자가 이기네."],
    "20s": ["2020년… 거의 다 왔네. 하지만 이 시대의 첫 봄엔 온 세상 항구가 멈출 걸세. 이 파도만 넘으면 자네의 시간이야."],
    "live": ["여기서부턴 진짜 시간이야. 내일 환율은 나도 모르네. 이제 자네 실력으로 가게. 행운을 비네."]
  };

  // ---------- 말풍선 ----------
  let bubble = null, queue = [], step = null, tut = null;
  function ensureBubble() {
    if (bubble) return bubble;
    bubble = document.createElement("div");
    bubble.className = "guide"; bubble.id = "guide"; bubble.hidden = true;
    document.body.appendChild(bubble);
    bubble.addEventListener("click", e => {
      const b = e.target.closest("[data-gd]"); if (!b) return;
      if (b.dataset.gd === "skip") { endTutorial(true); return; }
      if (b.dataset.gd === "next") advance();
    });
    return bubble;
  }
  function show(text, opts = {}) {
    const el = ensureBubble();
    const top = !$("#sheet").hidden;
    el.className = "guide" + (top ? " top" : "");
    el.innerHTML = `<div class="guide-card">${opts.who === "hero" ? heroImg() : guideImg()}
      <div class="guide-body"><b>${opts.who === "hero" ? "나" : GUIDE}</b><p>${text}</p>
      <div class="guide-btns">${opts.skip ? `<button class="gbtn ghost" data-gd="skip" type="button">튜토리얼 건너뛰기</button>` : ""}
      ${opts.wait ? `<span class="gwait">${opts.wait}</span>` : `<button class="gbtn" data-gd="next" type="button">${opts.btn || "다음"}</button>`}</div></div></div>`;
    el.hidden = false;
    $("#sheet").classList.toggle("with-guide", top);
  }
  function hide() { if (bubble) bubble.hidden = true; $("#sheet").classList.remove("with-guide"); }
  // 대사 여러 줄을 차례로
  function say(lines, then) {
    queue = lines.slice(); step = { then };
    sayNext();
  }
  function sayNext() {
    if (!queue.length) { const t = step && step.then; step = null; hide(); t && t(); return; }
    show(queue.shift(), { btn: queue.length ? "다음" : "알겠어요" });
  }

  // ---------- 튜토리얼 ----------
  const G = () => window.Game;
  const STEPS = [
    { text: "여기가 세계 항로도일세. 점 하나하나가 항구고, 빨간 점은 지난달보다 그 나라 돈이 비싸진 곳, 파란 점은 싸진 곳이야. 지도 아래 <b>도시 목록</b>에서 <b>서울</b>을 눌러 보게.", focus: '.citychip[data-port="seoul"]', wait: "port", hint: "도시 목록에서 서울" },
    { text: () => `이게 서울 시장이야. 그 항구의 <b>특산품</b>은 싸게 살 수 있지. <b>${G().G.kr.name(G().S.i)}</b>을(를) 눌러 보게.`, focus: '.good[data-good="kr"]', wait: "openGood", hint: "특산품을 눌러 보세요" },
    { text: "<b>최대</b>를 눌러 수량을 정하고 <b>사기</b>를 누르게. 살 수 있는 만큼 담아 줄 걸세.", focus: ".stepper, .acts", wait: "buy", hint: "최대 → 사기" },
    { text: "좋아. 이제 아래에서 <b>팔 때 값이 비싼 항구</b>를 골라 <b>출항</b>하게. 옆의 숫자는 걸리는 달 수야. <b>선물 계약</b>은 도착해서 받을 돈을 지금 확정하는 것, <b>보험</b>은 폭풍 대비일세.", focus: ".sec", wait: "ship", hint: "항구 고르기 → 출항" },
    { text: "배가 바다를 건너는 데는 몇 달이 걸리지. <b>다음 달</b>을 눌러 시간을 보내게. 배가 도착하면 알려 주겠네.", focus: "#btnNext", wait: "arrive", hint: "다음 달을 눌러 보세요" },
    { text: () => tut.hedged ? "선물 계약대로 자동으로 팔렸군! 약속한 값을 그대로 받았네. 환율이 어떻게 움직였든 상관없이 말이지." : `도착했군! 도시 목록에서 <b>${G().M[tut.to].name}</b>을(를) 누르고, 물건을 <b>팔게</b>. 판매가가 빨간색이면 평단가보다 비싸다는 뜻이야.`, before: () => { if (!tut.hedged && window.UI) UI.showRegion(G().M[tut.to].region); }, focus: () => tut.hedged ? null : `.citychip[data-port="${tut.to}"], .good[data-good="${tut.g}"]`, wait: () => tut.hedged ? null : "sell", hint: "도착한 항구 → 물건 → 팔기" },
    { text: "잘했네! 장사의 기본은 이걸세. <b>싸게 사서, 옮기고, 비싸게 판다.</b> 그리고 환율이 크게 움직일 때가 가장 큰 기회지. 한 나라 돈이 갑자기 싸지면, 그 나라 물건도 갑자기 싸지거든.", focus: "#map" },
    { text: "혼자서 여섯 항구를 다 돌볼 순 없지. 시장 화면의 <b>지점장</b> 칸에서 사람을 뽑으면 매달 알아서 사고, 보내고, 팔아 준다네. 다만 배 1척에 1~2명이 알맞아. 너무 많이 뽑으면 월급만 나가.", focus: ".mslot" },
    { text: () => `돈이 모이면 <b>투자·대출</b>에서 배와 창고를 늘리게. 은행에서 돈을 빌릴 수도 있지만, 남의 나라 돈으로 빌렸다가 우리 돈 값이 떨어지면 빚이 불어나니 조심하게. 이번 시대의 목표는 재산 <b>${TARGET[G().S.scen] || 2}배</b>야. 그리고 뉴스를 잘 보게. 역사는 그대로 반복되진 않아도, 늘 비슷한 운율을 타거든.`, focus: "#btnUpg", btn: "시작하기" }
  ];
  const val = v => typeof v === "function" ? v() : v;
  function startTutorial() {
    tut = { k: 0 }; runStep();
  }
  function runStep() {
    clearFocus();
    if (!tut) return;
    if (tut.k >= STEPS.length) return endTutorial(false);
    const s = STEPS[tut.k];
    if (s.before) s.before();
    const wait = val(s.wait);
    tut.wait = wait; tut.focus = val(s.focus);
    show(val(s.text), { skip: true, wait: wait ? "→ " + s.hint : null, btn: s.btn });
    refocus(true);
  }
  function advance() {
    if (step) return sayNext();
    if (tut && !tut.wait) { tut.k++; runStep(); }
  }
  function endTutorial(skipped) {
    clearFocus(); hide(); tut = null;
    flags.tut = true; saveFlags();
    if (skipped) say(["언제든 맨 아래 '시대 선택'에서 튜토리얼을 다시 볼 수 있네. 그럼, 좋은 항해를!"]);
  }
  function clearFocus() { document.querySelectorAll(".tut-focus").forEach(e => e.classList.remove("tut-focus")); }
  function refocus(scroll) {
    if (bubble && !bubble.hidden) {
      const top = !$("#sheet").hidden;
      bubble.classList.toggle("top", top);
      $("#sheet").classList.toggle("with-guide", top);
    }
    if (!tut || !tut.focus) return;
    clearFocus();
    const els = [...document.querySelectorAll(tut.focus)].filter(e => e.offsetParent !== null);
    els.forEach(e => e.classList.add("tut-focus"));
    if (scroll && els[0]) els[0].scrollIntoView({ behavior: "smooth", block: "center" });
    if (bubble && !bubble.hidden) {
      const top = !$("#sheet").hidden;
      bubble.classList.toggle("top", top);
      $("#sheet").classList.toggle("with-guide", top);
    }
  }
  // 게임 화면에서 일어난 일 알려 받기
  function ev(name, data) {
    if (!tut) return;
    if (name === "next" && tut.wait === "arrive") {
      const a = (data || []).find(x => x.v);
      if (a) { tut.to = a.v.to; tut.g = a.v.g; tut.hedged = a.v.hedge != null; tut.k++; return runStep(); }
      show("아직 바다 위일세. 한 번 더 <b>다음 달</b>을 눌러 보게.", { skip: true, wait: "→ 다음 달" });
      return refocus();
    }
    if (name === tut.wait) { tut.k++; runStep(); }
    else refocus();
  }

  // ---------- 시나리오 시작·끝 ----------
  function startScenario(scId) {
    const lines = (ERA[scId] || []).slice();
    if (!flags.tut) {
      lines.push("처음이니 장사하는 법부터 알려 주겠네. 내가 시키는 대로 한 번만 따라 해 보게.");
      say(lines, startTutorial);
    } else say(lines);
  }
  function target(scId) { return TARGET[scId] || null; }
  function endLines(S, cleared) {
    if (S.scen === "20s" && cleared) return "시곗바늘이 멈췄다. 눈을 뜨니 2026년 11월, 부산의 그 시계방 앞이다. 노인은 보이지 않고, 문 위에 쪽지 한 장. \"이제부턴 자네의 시간이야.\"";
    if (cleared) return "회중시계가 따뜻해지며 바늘이 앞으로 돌기 시작했다. 다음 시대로 가는 문이 열렸네!";
    return "시계 태엽이 풀려 버렸군. 하지만 걱정 말게. 시간은 다시 감으면 그만이야.";
  }
  function replayTutorial() { flags.tut = false; saveFlags(); }

  return {
    get flags() { return flags; }, prologue, startScenario, target, endLines, ev, refocus, replayTutorial,
    sayLive: () => say(ERA.live), guideImg, heroImg
  };
})();
