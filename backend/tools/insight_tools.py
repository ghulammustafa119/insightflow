import os
import json
from datetime import datetime, timezone

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
_model = genai.GenerativeModel("gemini-1.5-flash")

INSIGHT_PROMPT = """You are a business intelligence extraction agent analyzing content for a supply chain company.

Source Type: {source_type}
Source Timestamp: {timestamp}
Credibility Score: {credibility_score}
Content:
{content}

Extract exactly 3 to 5 key business signals from this content.
Focus on: stock levels, delivery issues, supplier reliability, demand changes, customer impact.

Return ONLY a valid JSON array with no explanation:
[
  {{
    "signal": "one clear business signal sentence",
    "category": "risk or trend or opportunity or anomaly",
    "confidence": 0.0 to 1.0,
    "temporal_marker": "YYYY-MM-DD",
    "metric": "the specific metric name (e.g. stock_level, supplier_reliability)",
    "value": "the specific value mentioned (e.g. 8%, 2 days, 42%)"
  }}
]"""

_insight_counter = [0]


def _next_insight_id() -> str:
    _insight_counter[0] += 1
    return f"ins_{_insight_counter[0]:03d}"


def _fallback_insights(source: dict) -> list:
    return [{
        "insight_id": _next_insight_id(),
        "source_id": source["source_id"],
        "source_type": source["source_type"],
        "signal": "Could not extract insights from this source",
        "category": "anomaly",
        "confidence": 0.3,
        "temporal_marker": source.get("timestamp", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "metric": None,
        "value": None,
    }]


def extract_insights_from_source(source: dict) -> list:
    content = source.get("content_raw", "")[:2000]
    prompt = INSIGHT_PROMPT.format(
        source_type=source["source_type"],
        timestamp=source.get("timestamp", ""),
        credibility_score=source.get("credibility_score", 0.5),
        content=content,
    )

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        insights_raw = json.loads(text)
        insights = []
        for item in insights_raw:
            insights.append({
                "insight_id": _next_insight_id(),
                "source_id": source["source_id"],
                "source_type": source["source_type"],
                "signal": item.get("signal", ""),
                "category": item.get("category", "anomaly"),
                "confidence": float(item.get("confidence", 0.5)),
                "temporal_marker": item.get("temporal_marker", source.get("timestamp", "")),
                "metric": item.get("metric"),
                "value": item.get("value"),
            })
        return insights
    except Exception as e:
        print(f"[Insights] Error for {source['source_id']}: {e}")
        return _fallback_insights(source)


def extract_all_insights(sources: list) -> list:
    all_insights = []
    for i, source in enumerate(sources):
        print(f"[Insights] Extracting insights from source {i+1}/{len(sources)}: {source['source_type'].upper()}")
        insights = extract_insights_from_source(source)
        all_insights.extend(insights)
    print(f"[Insights] Total insights extracted: {len(all_insights)}")
    return all_insights
