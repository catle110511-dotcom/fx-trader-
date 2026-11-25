/* =====================================================================
   extras.js — 기록·업적, 효과음
   ※ 이 기기 브라우저에만 저장됩니다(다른 기기와 공유 안 됨).
   ===================================================================== */
window.Extras = (() => {
  const KEY = "fxtrader.records";
  let R = { best: {}, ach: {}, sound: true };
  try { R = Object.assign(R, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) {} };

  // ---------- 업적 ----------
  const ACH = [
    { id: "ship1", name: "첫 출항", desc: "처음으로 배를 띄웠어요" },
    { id: "profit1", name: "첫 흑자", desc: "평단가보다 비싸게 팔았어요" },
    { id: "hedge1", name: "선견지명", desc: "선물 계약을 걸고 출항했어요" },
    { id: "mgr3", name: "지점장 셋", desc: "지점장을 3명 이상 두었어요" },
    { id: "fleet5", name: "대선단", desc: "화물선 5척을 갖췄어요" },
    { id: "world", name: "세계일주", desc: "10개 이상 항구에서 거래했어요" },
    { id: "rich", name: "10억 상인", desc: "순자산 10억원을 넘었어요" },
    { id: "clear1", name: "시대 정복", desc: "시대 목표를 처음 달성했어요" },
    { id: "imf", name: "추위 속의 기회", desc: "1990년대 목표를 달성했어요" },
    { id: "home", name: "시간 여행자", desc: "2020년대를 넘어 원래 시간으로 돌아왔어요" }
  ];
  let onUnlock = null;
  function unlock(id) {
    if (R.ach[id]) return;
    R.ach[id] = Date.now(); save();
    const a = ACH.find(x => x.id === id);
    if (a && onUnlock) onUnlock(a);
    play("ach");
  }
  // 게임 상태를 보고 업적 확인
  function check(G) {
    const S = G.S;
    if (Object.keys(S.mgr || {}).length >= 3) unlock("mgr3");
    if (S.ships >= 5) unlock("fleet5");
    if ((S.traded || []).length >= 10) unlock("world");
    if (G.netWorth() >= 1e9) unlock("rich");
  }
  function scenarioEnd(scId, mult, cleared) {
    R.best[scId] = Math.max(R.best[scId] || 0, mult); save();
    if (cleared) { unlock("clear1"); if (scId === "90s") unlock("imf"); if (scId === "20s") unlock("home"); }
  }

  // ---------- 효과음 (따로 파일 없이 소리를 만들어 냄) ----------
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(f, t0, dur, type = "sine", vol = 0.12, f2) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), gn = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SOUNDS = {
    buy: () => { tone(660, 0, 0.08, "triangle", 0.08); },
    coin: () => { tone(988, 0, 0.09, "square", 0.05); tone(1319, 0.08, 0.25, "square", 0.05); },
    horn: () => { tone(110, 0, 0.9, "sawtooth", 0.06); tone(165, 0, 0.9, "sawtooth", 0.04); },
    next: () => { tone(520, 0, 0.06, "sine", 0.05); },
    news: () => { tone(784, 0, 0.15, "triangle", 0.08); tone(1047, 0.14, 0.3, "triangle", 0.08); },
    ach: () => { [523, 659, 784, 1047].forEach((f, k) => tone(f, k * 0.09, 0.2, "triangle", 0.07)); },
    bad: () => { tone(300, 0, 0.35, "sine", 0.08, 180); }
  };
  function play(name) { if (R.sound && SOUNDS[name]) try { SOUNDS[name](); } catch (e) {} }
  function toggleSound() { R.sound = !R.sound; save(); if (R.sound) play("buy"); return R.sound; }

  return {
    ACH, get R() { return R; }, unlock, check, scenarioEnd, play, toggleSound,
    set onUnlock(fn) { onUnlock = fn; }
  };
})();
