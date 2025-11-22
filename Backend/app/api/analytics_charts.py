"""Analytics charts API: time-series, insights, predictions, and comprehensive visualizations."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import math

from app.api.docs import get_current_user, require_admin
from app.core import analytics
from app.llm.llm import get_llm
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


def _parse_timestamp(ts_str: str) -> datetime:
    """Parse ISO timestamp string to datetime."""
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def _bucket_timestamp(dt: datetime, bucket: str = "day") -> str:
    """Return a bucket key (YYYY-MM-DD for day, YYYY-MM for month, etc.)."""
    if bucket == "hour":
        return dt.strftime("%Y-%m-%d %H:00")
    elif bucket == "day":
        return dt.strftime("%Y-%m-%d")
    elif bucket == "week":
        # ISO week number
        return f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
    elif bucket == "month":
        return dt.strftime("%Y-%m")
    else:
        return dt.strftime("%Y-%m-%d")


@router.get("/analytics/charts/questions-timeseries")
def get_questions_timeseries(
    bucket: str = "day",
    days_back: int = 30,
    admin_user: dict = Depends(require_admin),
) -> Dict[str, Any]:
    """Return questions over time (time-series) with configurable bucketing.

    - bucket: "hour", "day", "week", "month"
    - days_back: number of days to include
    - Returns: { buckets: [{ key, count, timestamp }], total }
    """
    questions = analytics.list_questions()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    bucketed: Dict[str, int] = defaultdict(int)
    for q in questions:
        ts = _parse_timestamp(q.get("timestamp", datetime.now(timezone.utc).isoformat()))
        if ts >= cutoff:
            key = _bucket_timestamp(ts, bucket)
            bucketed[key] += 1
    
    sorted_keys = sorted(bucketed.keys())
    result = [{"key": k, "count": bucketed[k]} for k in sorted_keys]
    
    return {
        "bucket": bucket,
        "days_back": days_back,
        "buckets": result,
        "total": len([q for q in questions if _parse_timestamp(q.get("timestamp", datetime.now(timezone.utc).isoformat())) >= cutoff]),
    }


@router.get("/analytics/charts/tags-timeseries")
def get_tags_timeseries(
    bucket: str = "day",
    days_back: int = 30,
    top_n: int = 5,
    admin_user: dict = Depends(require_admin),
) -> Dict[str, Any]:
    """Return top N tags over time (stacked area / multi-line chart).

    - bucket: bucketing period
    - top_n: number of top tags to include
    - Returns: { tags: [tag_name], buckets: [{ key, tag_counts }] }
    """
    questions = analytics.list_questions()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    # collect all tags with counts
    tag_counts: Dict[str, int] = defaultdict(int)
    bucketed_tags: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    
    for q in questions:
        ts = _parse_timestamp(q.get("timestamp", datetime.now(timezone.utc).isoformat()))
        if ts >= cutoff:
            key = _bucket_timestamp(ts, bucket)
            for tag in q.get("tags", []):
                tag_counts[tag] += 1
                bucketed_tags[key][tag] += 1
    
    # get top tags
    top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
    top_tag_names = [t[0] for t in top_tags]
    
    sorted_keys = sorted(bucketed_tags.keys())
    result = []
    for k in sorted_keys:
        tag_data = {tag: bucketed_tags[k].get(tag, 0) for tag in top_tag_names}
        result.append({"key": k, **tag_data})
    
    return {
        "bucket": bucket,
        "top_tags": top_tag_names,
        "buckets": result,
    }


@router.get("/analytics/charts/distribution")
def get_distribution(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return distributions for pie/bar charts: by user, by tag, by MCP usage."""
    stats = analytics.stats_summary()
    
    return {
        "by_user": [{"name": user, "value": count} for user, count in stats.get("by_user", {}).items()],
        "by_tag": [{"name": tag, "value": count} for tag, count in stats.get("by_tag", {}).items()],
        "mcp_usage": [{"name": mcp, "value": count} for mcp, count in stats.get("mcp_usage", {}).items()],
    }


@router.get("/analytics/charts/user-comparison")
def get_user_comparison(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return metrics per user for comparative bar/scatter charts."""
    questions = analytics.list_questions()
    user_metrics: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "mcp_used": 0, "avg_tags": 0, "tags": []})
    
    for q in questions:
        user = q.get("username") or "unknown"
        user_metrics[user]["total"] += 1
        if q.get("used_mcp"):
            user_metrics[user]["mcp_used"] += 1
        user_metrics[user]["tags"].extend(q.get("tags", []))
    
    result = []
    for user, metrics in user_metrics.items():
        tag_list = metrics["tags"]
        avg_tags = len(tag_list) / metrics["total"] if metrics["total"] > 0 else 0
        result.append({
            "user": user,
            "total_questions": metrics["total"],
            "mcp_used_count": metrics["mcp_used"],
            "mcp_usage_rate": (metrics["mcp_used"] / metrics["total"]) if metrics["total"] > 0 else 0,
            "avg_tags_per_question": avg_tags,
        })
    
    return {"users": result}


@router.get("/analytics/charts/tag-correlation")
def get_tag_correlation(top_n: int = 10, admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return tag co-occurrence (heatmap data): tags that often appear together."""
    questions = analytics.list_questions()
    
    # count co-occurrences
    tag_pairs: Dict[tuple, int] = defaultdict(int)
    all_tags: set = set()
    
    for q in questions:
        tags = q.get("tags", [])
        all_tags.update(tags)
        # count all pairs
        for i, t1 in enumerate(tags):
            for t2 in tags[i+1:]:
                pair = tuple(sorted([t1, t2]))
                tag_pairs[pair] += 1
    
    # get top tags
    top_tags = sorted(all_tags, key=lambda t: sum(1 for q in questions if t in q.get("tags", [])), reverse=True)[:top_n]
    
    # build heatmap matrix
    heatmap: Dict[str, Dict[str, int]] = {tag: {other: 0 for other in top_tags} for tag in top_tags}
    for (t1, t2), count in tag_pairs.items():
        if t1 in top_tags and t2 in top_tags:
            heatmap[t1][t2] = count
            heatmap[t2][t1] = count
    
    return {
        "tags": top_tags,
        "heatmap": heatmap,
    }


@router.get("/analytics/charts/success-rate")
def get_success_rate(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return success metrics: answer completeness, MCP efficiency."""
    questions = analytics.list_questions()
    
    if not questions:
        return {"total": 0, "with_answer": 0, "with_mcp": 0, "avg_answer_length": 0}
    
    with_answer = len([q for q in questions if q.get("final_answer")])
    with_mcp = len([q for q in questions if q.get("used_mcp")])
    avg_answer_len = sum(len(q.get("final_answer", "")) for q in questions) / len(questions) if questions else 0
    
    return {
        "total_questions": len(questions),
        "answered": with_answer,
        "answered_rate": (with_answer / len(questions)) if questions else 0,
        "with_mcp": with_mcp,
        "mcp_rate": (with_mcp / len(questions)) if questions else 0,
        "avg_answer_length": avg_answer_len,
    }


@router.get("/analytics/charts/insights")
def get_llm_insights(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Use LLM to analyze questions and generate human-readable insights."""
    try:
        questions = analytics.list_questions()
        if not questions:
            return {"insights": "No questions recorded yet.", "recommendations": []}
        
        llm = get_llm()
        
        # prepare summary for LLM
        stats = analytics.stats_summary()
        recent_questions = sorted(questions, key=lambda q: q.get("timestamp", ""), reverse=True)[:10]
        recent_text = "\n".join([f"- {q.get('question')[:100]} (tags: {','.join(q.get('tags', []))})" for q in recent_questions])
        
        prompt = f"""Analyze these DevOps support analytics and provide brief insights:

Total questions: {len(questions)}
By user: {stats.get('by_user', {})}
Top tags: {dict(sorted(stats.get('by_tag', {}).items(), key=lambda x: x[1], reverse=True)[:5])}
MCP usage: {stats.get('mcp_usage', {})}

Recent questions:
{recent_text}

Provide:
1. 2-3 key insights about usage patterns
2. 2-3 actionable recommendations
Format: INSIGHTS: <insights> RECOMMENDATIONS: <recommendations>"""
        
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)
        
        # parse response
        insights = content.split("RECOMMENDATIONS:")[0].replace("INSIGHTS:", "").strip() if "INSIGHTS:" in content else content[:200]
        recommendations_text = content.split("RECOMMENDATIONS:")[1].strip() if "RECOMMENDATIONS:" in content else ""
        recommendations = [r.strip() for r in recommendations_text.split("\n") if r.strip()][:3]
        
        return {
            "insights": insights,
            "recommendations": recommendations,
            "total_questions": len(questions),
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("LLM insights failed: %s", e)
        return {"insights": "Unable to generate insights at this time.", "recommendations": []}


@router.get("/analytics/charts/predictions")
def get_predictions(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Use LLM to predict future trends."""
    try:
        questions = analytics.list_questions()
        if len(questions) < 5:
            return {"prediction": "Insufficient data for meaningful predictions.", "confidence": 0}
        
        llm = get_llm()
        
        # simple trend: last 7 days vs before
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        
        recent_7 = len([q for q in questions if _parse_timestamp(q.get("timestamp", "")) >= week_ago])
        prev_7 = len([q for q in questions if two_weeks_ago <= _parse_timestamp(q.get("timestamp", "")) < week_ago])
        
        trend = "increasing" if recent_7 > prev_7 else "decreasing" if recent_7 < prev_7 else "stable"
        growth_rate = ((recent_7 - prev_7) / prev_7 * 100) if prev_7 > 0 else 0
        
        stats = analytics.stats_summary()
        top_tags = sorted(stats.get("by_tag", {}).items(), key=lambda x: x[1], reverse=True)[:3]
        
        prompt = f"""Based on DevOps question analytics, predict future trends:

Current trend: {trend} ({growth_rate:+.1f}% growth)
Recent 7 days: {recent_7} questions
Previous 7 days: {prev_7} questions
Top tags: {top_tags}

Provide a brief prediction (1-2 sentences) about:
1. Expected question volume trend
2. Likely top topics in the next period
Format: PREDICTION: <prediction> CONFIDENCE: <low/medium/high>"""
        
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)
        
        prediction = content.split("CONFIDENCE:")[0].replace("PREDICTION:", "").strip() if "PREDICTION:" in content else content[:200]
        confidence = content.split("CONFIDENCE:")[1].strip() if "CONFIDENCE:" in content else "medium"
        
        return {
            "prediction": prediction,
            "confidence": confidence,
            "trend": trend,
            "growth_rate_percent": growth_rate,
            "recent_7d": recent_7,
            "prev_7d": prev_7,
        }
    except Exception as e:
        logger.error("Predictions failed: %s", e)
        return {"prediction": "Unable to generate predictions at this time.", "confidence": "low"}


@router.get("/analytics/charts/heatmap-hours")
def get_heatmap_hours(days_back: int = 30, admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return hourly heatmap (which hours are busiest) for visualization."""
    questions = analytics.list_questions()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    # count by day-of-week and hour
    heatmap: Dict[str, Dict[str, int]] = {
        f"Mon": {f"{h:02d}:00": 0 for h in range(24)},
        f"Tue": {f"{h:02d}:00": 0 for h in range(24)},
        f"Wed": {f"{h:02d}:00": 0 for h in range(24)},
        f"Thu": {f"{h:02d}:00": 0 for h in range(24)},
        f"Fri": {f"{h:02d}:00": 0 for h in range(24)},
        f"Sat": {f"{h:02d}:00": 0 for h in range(24)},
        f"Sun": {f"{h:02d}:00": 0 for h in range(24)},
    }
    
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for q in questions:
        ts = _parse_timestamp(q.get("timestamp", datetime.now(timezone.utc).isoformat()))
        if ts >= cutoff:
            day_name = day_names[ts.weekday()]
            hour_key = f"{ts.hour:02d}:00"
            heatmap[day_name][hour_key] += 1
    
    return {
        "heatmap": heatmap,
        "days_back": days_back,
    }


@router.get("/analytics/charts/scatter-tags-volume")
def get_scatter_tags_volume(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return scatter plot data: tag frequency vs avg questions per tag (for identifying patterns)."""
    questions = analytics.list_questions()
    
    tag_info: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"total": 0, "in_questions": 0})
    
    for q in questions:
        for tag in q.get("tags", []):
            tag_info[tag]["in_questions"] += 1
    
    # count questions that have each tag
    for tag in tag_info:
        tag_info[tag]["total"] = sum(1 for q in questions if tag in q.get("tags", []))
    
    scatter_points = []
    for tag, info in tag_info.items():
        scatter_points.append({
            "tag": tag,
            "frequency": info["total"],
            "avg_per_q": (info["in_questions"] / info["total"]) if info["total"] > 0 else 0,
        })
    
    return {
        "points": scatter_points,
        "total_tags": len(tag_info),
    }


@router.get("/analytics/charts/agent-efficiency")
def get_agent_efficiency(admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Return agent performance metrics: which agents run most, avg steps per question."""
    questions = analytics.list_questions()
    
    agent_counts: Dict[str, int] = defaultdict(int)
    total_steps = 0
    
    for q in questions:
        steps = q.get("agent_steps", [])
        total_steps += len(steps)
        for step in steps:
            agent = step.get("agent", "unknown")
            agent_counts[agent] += 1
    
    avg_steps = total_steps / len(questions) if questions else 0
    
    return {
        "agents": [{"agent": agent, "count": count} for agent, count in sorted(agent_counts.items(), key=lambda x: x[1], reverse=True)],
        "total_steps": total_steps,
        "avg_steps_per_question": avg_steps,
    }


@router.get("/analytics/history/user")
def get_user_history(limit: int = 50, current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Return question history for the current user (extracted from JWT).
    
    - limit: max number of records to return
    - Returns: { user, total_questions, recent: [{ id, question, timestamp, tags, final_answer, used_mcp, mcp_results }] }
    """
    username = current_user.get("username")
    
    all_questions = analytics.list_questions(username=username)
    # sort by timestamp descending (newest first)
    sorted_questions = sorted(all_questions, key=lambda q: q.get("timestamp", ""), reverse=True)[:limit]
    
    # format for frontend
    recent = []
    for q in sorted_questions:
        recent.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "timestamp": q.get("timestamp"),
            "tags": q.get("tags", []),
            "final_answer": q.get("final_answer"),
            "used_mcp": q.get("used_mcp"),
            "mcp_results": q.get("mcp_results", []),
            "agent_steps": q.get("agent_steps", []),
        })
    
    # compute stats for this user
    user_stats = {
        "total_questions": len(all_questions),
        "answered": len([q for q in all_questions if q.get("final_answer")]),
        "with_mcp": len([q for q in all_questions if q.get("used_mcp")]),
        "avg_answer_length": sum(len(q.get("final_answer", "")) for q in all_questions) / len(all_questions) if all_questions else 0,
    }
    
    return {
        "user": username,
        "stats": user_stats,
        "recent": recent,
        "total_returned": len(recent),
    }


@router.get("/analytics/history/admin/user/{username}")
def get_user_history_admin(username: str, limit: int = 50, admin_user: dict = Depends(require_admin)) -> Dict[str, Any]:
    """Admin-only endpoint to view any user's question history (by username in path).
    
    - username: username to fetch history for
    - limit: max number of records to return
    - Returns: { user, total_questions, recent: [...] }
    """
    all_questions = analytics.list_questions(username=username)
    # sort by timestamp descending (newest first)
    sorted_questions = sorted(all_questions, key=lambda q: q.get("timestamp", ""), reverse=True)[:limit]
    
    # format for frontend
    recent = []
    for q in sorted_questions:
        recent.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "timestamp": q.get("timestamp"),
            "tags": q.get("tags", []),
            "final_answer": q.get("final_answer"),
            "used_mcp": q.get("used_mcp"),
            "mcp_results": q.get("mcp_results", []),
            "agent_steps": q.get("agent_steps", []),
        })
    
    # compute stats for this user
    user_stats = {
        "total_questions": len(all_questions),
        "answered": len([q for q in all_questions if q.get("final_answer")]),
        "with_mcp": len([q for q in all_questions if q.get("used_mcp")]),
        "avg_answer_length": sum(len(q.get("final_answer", "")) for q in all_questions) / len(all_questions) if all_questions else 0,
    }
    
    return {
        "user": username,
        "stats": user_stats,
        "recent": recent,
        "total_returned": len(recent),
    }

