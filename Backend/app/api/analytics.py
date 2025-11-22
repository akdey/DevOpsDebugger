"""Analytics API: expose recorded questions and aggregated stats."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from app.api.docs import get_current_user, require_admin
from app.core import analytics

router = APIRouter()


@router.get("/analytics/questions", response_model=List[Dict])
def get_questions(current_user: dict = Depends(get_current_user)):
    """Return recorded questions for the current user; admins get all."""
    if current_user and current_user.get("role") == "admin":
        return analytics.list_questions()
    return analytics.list_questions(username=current_user.get("username"))


@router.get("/analytics/stats", response_model=Dict)
def get_stats(admin_user: dict = Depends(require_admin)):
    """Return aggregated stats (admin only)."""
    return analytics.stats_summary()
