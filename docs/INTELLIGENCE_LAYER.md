# Intelligence Layer

## Messy inputs (later)
- Free-text meeting title / attendees string.
- Implied need: "I need a room for 8 with a projector."

## Auto-structure schema (later)
```json
{
  "parsed_need": {
    "attendee_count": 8,
    "required_facilities": ["projector"],
    "preferred_floor": 3,
    "duration_minutes": 60
  },
  "source": "title_free_text",
  "confidence": 0.7,
  "review_status": "unreviewed"
}
```
Any AI-derived suggestion stores value + `source` + `confidence` + `review_status`.

## Events to track (later)
- booking_created, booking_cancelled, overlap_blocked, room_suggested.

## Scoring rules (rule-based, later)
- Room match score = 0.4×capacity_fit + 0.4×facilities_match + 0.2×floor_preference.
- capacity_fit = 1 if room.capacity ≥ attendee_count else 0.
- Rank top 3 free rooms by score.

## v1 vs later
- **v1:** none. Availability grid is pure data + overlap logic.
- **Later:** auto-suggest best room from a free-text need; usage analytics ranking.
