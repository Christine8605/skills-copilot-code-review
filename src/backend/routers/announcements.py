"""Announcement endpoints for the High School Management System API."""

from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


class AnnouncementInput(BaseModel):
    """Request body used to create or update an announcement."""

    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=500)
    expiration_date: date
    start_date: Optional[date] = None


def _validate_teacher(username: Optional[str]) -> Dict[str, Any]:
    """Validate managing user and return teacher record."""
    if not username:
        raise HTTPException(status_code=401, detail="Authentication required for this action")

    teacher = teachers_collection.find_one({"_id": username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid teacher credentials")

    return teacher


def _validate_dates(start_date: Optional[date], expiration_date: date) -> None:
    """Ensure optional start date is not after expiration date."""
    if start_date and start_date > expiration_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before or equal to expiration date"
        )


def _serialize_announcement(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "message": doc["message"],
        "start_date": doc.get("start_date"),
        "expiration_date": doc["expiration_date"],
        "created_by": doc.get("created_by"),
        "updated_by": doc.get("updated_by")
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def get_announcements(active_only: bool = True) -> List[Dict[str, Any]]:
    """Get announcements, optionally filtered to only currently active announcements."""
    today = date.today().isoformat()
    query: Dict[str, Any] = {}

    if active_only:
        query = {
            "expiration_date": {"$gte": today},
            "$or": [
                {"start_date": {"$exists": False}},
                {"start_date": None},
                {"start_date": {"$lte": today}}
            ]
        }

    cursor = announcements_collection.find(query).sort("expiration_date", 1)
    return [_serialize_announcement(doc) for doc in cursor]


@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
def create_announcement(
    payload: AnnouncementInput,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Create a new announcement. Requires teacher authentication."""
    teacher = _validate_teacher(teacher_username)
    _validate_dates(payload.start_date, payload.expiration_date)

    normalized_title = payload.title.strip()
    if announcements_collection.find_one({"_id": normalized_title.lower().replace(" ", "-")}):
        raise HTTPException(status_code=400, detail="An announcement with this title already exists")

    announcement_doc = {
        "_id": normalized_title.lower().replace(" ", "-"),
        "title": normalized_title,
        "message": payload.message.strip(),
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expiration_date": payload.expiration_date.isoformat(),
        "created_by": teacher["username"],
        "updated_by": teacher["username"]
    }

    announcements_collection.insert_one(announcement_doc)
    return _serialize_announcement(announcement_doc)


@router.put("/{announcement_id}", response_model=Dict[str, Any])
def update_announcement(
    announcement_id: str,
    payload: AnnouncementInput,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Update an existing announcement. Requires teacher authentication."""
    teacher = _validate_teacher(teacher_username)
    _validate_dates(payload.start_date, payload.expiration_date)

    existing = announcements_collection.find_one({"_id": announcement_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")

    update_doc = {
        "title": payload.title.strip(),
        "message": payload.message.strip(),
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expiration_date": payload.expiration_date.isoformat(),
        "updated_by": teacher["username"]
    }

    announcements_collection.update_one(
        {"_id": announcement_id},
        {"$set": update_doc}
    )

    updated = announcements_collection.find_one({"_id": announcement_id})
    return _serialize_announcement(updated)


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, str]:
    """Delete an announcement. Requires teacher authentication."""
    _validate_teacher(teacher_username)

    result = announcements_collection.delete_one({"_id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted successfully"}
