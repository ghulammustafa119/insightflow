from datetime import datetime, timezone

CREDIBILITY_WEIGHTS = {
    "pdf": 0.85,
    "csv": 0.95,
    "json": 0.90,
    "url": 0.60,
    "feed": 0.75,
}


def calculate_source_weight(source_type: str, timestamp: str) -> float:
    base = CREDIBILITY_WEIGHTS.get(source_type, 0.5)
    try:
        ts = datetime.strptime(timestamp[:10], "%Y-%m-%d").date()
        today = datetime.now(timezone.utc).date()
        days_old = (today - ts).days
        if days_old == 0:
            recency = 1.0
        elif days_old == 1:
            recency = 0.9
        elif days_old == 2:
            recency = 0.7
        else:
            recency = 0.4
    except Exception:
        recency = 0.5
    return round(base * recency, 4)


def group_insights_by_metric(insights: list) -> dict:
    groups = {}
    for insight in insights:
        metric = insight.get("metric")
        if not metric:
            continue
        groups.setdefault(metric, []).append(insight)
    return groups


def detect_contradictions(insights: list, sources: list) -> dict:
    source_map = {s["source_id"]: s for s in sources}

    groups = group_insights_by_metric(insights)
    contradictions = []
    resolutions = []
    ground_truth = {}
    stale_source_ids = []

    for metric, group in groups.items():
        if len(group) < 2:
            if group:
                src = source_map.get(group[0]["source_id"], {})
                ground_truth[metric] = group[0].get("value", "")
            continue

        values = [g.get("value", "") for g in group]
        unique_values = set(v for v in values if v)

        if len(unique_values) <= 1:
            src = source_map.get(group[0]["source_id"], {})
            ground_truth[metric] = group[0].get("value", "")
            continue

        weighted = []
        for item in group:
            src = source_map.get(item["source_id"], {})
            w = calculate_source_weight(src.get("source_type", ""), src.get("timestamp", ""))
            weighted.append((w, item, src))

        weighted.sort(key=lambda x: x[0], reverse=True)
        trusted_weight, trusted_insight, trusted_src = weighted[0]
        stale_items = weighted[1:]

        conflict_list = [
            {"source": item["source_id"], "value": item.get("value", "")}
            for _, item, _ in weighted
        ]

        stale_ids = [item["source_id"] for _, item, _ in stale_items]
        stale_source_ids.extend(stale_ids)

        explanation = (
            f"Metric '{metric}' has conflicting values across sources. "
            f"Trusted source '{trusted_insight['source_id']}' ({trusted_src.get('source_type','')}, "
            f"weight={trusted_weight}) reports '{trusted_insight.get('value','')}'. "
            f"Stale/lower-credibility sources report different values."
        )
        resolution = (
            f"Resolved in favor of '{trusted_insight['source_id']}' "
            f"(weight={trusted_weight}). "
            f"Value accepted: '{trusted_insight.get('value','')}'. "
            f"Stale sources marked: {stale_ids}."
        )

        print(f"[Contradiction] Found conflict on metric '{metric}':")
        for w, item, src in weighted:
            print(f"  {item['source_id']} ({src.get('source_type','')}) → '{item.get('value','')}' [weight={w}]")
        print(f"  → Resolved: trusting {trusted_insight['source_id']}")

        contradictions.append({
            "metric": metric,
            "conflict": conflict_list,
            "explanation": explanation,
            "resolution": resolution,
            "trusted_source": trusted_insight["source_id"],
            "stale_sources": stale_ids,
        })
        resolutions.append(resolution)
        ground_truth[metric] = trusted_insight.get("value", "")

        for sid in stale_ids:
            for s in sources:
                if s["source_id"] == sid:
                    s["staleness_flag"] = True

    return {
        "contradictions": contradictions,
        "resolutions": resolutions,
        "ground_truth": ground_truth,
        "stale_source_ids": list(set(stale_source_ids)),
    }


def filter_noise(insights: list) -> list:
    filtered = [i for i in insights if i.get("confidence", 0) >= 0.3]

    seen = set()
    deduped = []
    for insight in filtered:
        key = (insight.get("metric"), insight.get("value"))
        if key not in seen:
            seen.add(key)
            deduped.append(insight)

    removed = len(insights) - len(deduped)
    if removed:
        print(f"[Contradiction] Noise filter removed {removed} low-confidence/duplicate insights.")
    return deduped
