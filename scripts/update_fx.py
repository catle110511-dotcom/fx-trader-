"""매일 실제 환율을 받아 live.js 를 갱신합니다 (GitHub Actions 에서 실행).

- 1차: open.er-api.com (무료, 키 없음, 하루 1번 갱신)
- 2차: api.frankfurter.app (유럽중앙은행 기준환율, 일부 통화만)
- 값은 '1달러당 통화', 날짜 키는 한국 날짜(YYYY-MM-DD)
- 유로로 바뀐 옛 통화 칸(FRF, ITL 등)은 유로 값을 그대로 넣습니다.
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIVE = ROOT / "live.js"
KEEP_DAYS = 60
KST = timezone(timedelta(hours=9))

CURRENCIES = ["KRW", "JPY", "GBP", "EUR", "CNY", "HKD", "SGD", "THB", "INR", "AUD", "CAD", "BRL",
              "ZAR", "CHF", "TWD", "MYR", "LKR", "SEK", "NOK", "DKK", "MXN", "NZD"]
EURO_LEGACY = ["FRF", "ITL", "NLG", "BEF", "ESP", "PTE", "GRD"]


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "fx-trader-game/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_rates():
    rates = {}
    try:
        data = get_json("https://open.er-api.com/v6/latest/USD")
        if data.get("result") == "success":
            rates.update({k: float(v) for k, v in data["rates"].items() if k in CURRENCIES})
    except Exception as e:  # 다음 출처로 넘어감
        print("open.er-api 실패:", e, file=sys.stderr)
    missing = [c for c in CURRENCIES if c not in rates]
    if missing:
        try:
            data = get_json("https://api.frankfurter.app/latest?from=USD")
            for k, v in data.get("rates", {}).items():
                if k in missing:
                    rates[k] = float(v)
        except Exception as e:
            print("frankfurter 실패:", e, file=sys.stderr)
    return rates


def load_existing():
    if not LIVE.exists():
        return {}
    m = re.search(r"window\.LIVE_FX\s*=\s*(\{.*?\});", LIVE.read_text(encoding="utf-8"), re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return {}


def main():
    rates = fetch_rates()
    if len(rates) < 10:
        print("환율을 충분히 받지 못해 이번에는 건너뜁니다:", sorted(rates), file=sys.stderr)
        return 0
    if "EUR" in rates:
        for k in EURO_LEGACY:
            rates[k] = rates["EUR"]
    now = datetime.now(KST)
    day = now.strftime("%Y-%m-%d")
    data = load_existing()
    data[day] = {k: round(v, 6) for k, v in sorted(rates.items())}
    cutoff = (now - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")
    data = {k: data[k] for k in sorted(data) if k >= cutoff}
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    LIVE.write_text(
        "/* live.js — 현재 모드용 실제 일별 환율 (1달러당 통화). GitHub Actions 가 자동으로 갱신해요. */\n"
        f"window.LIVE_FX = {body};\n"
        f"window.LIVE_FX_UPDATED = \"{now.strftime('%Y-%m-%d %H:%M')} KST\";\n",
        encoding="utf-8",
    )
    print(f"{day}: {len(rates)}개 통화 저장, 원/달러 {rates.get('KRW')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
