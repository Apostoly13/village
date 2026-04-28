"""
local_areas.py — Australian suburb and postcode to local Chat Room area lookup.

Maps a user's suburb name or postcode to a colloquial area name used as the
local Chat Room identifier.

Data sources:
  - data/suburb_areas.json   — 16,220 Australian suburbs → area name
  - data/postcode_areas.json — 3,182 Australian postcodes → area name

Suburb data is derived from the Matthew Proctor Australian Postcodes dataset
(public domain). Curated area names cover major metro regions; regional areas
use ABS SA4 statistical region names as fallback.

To add or rename areas: edit the JSON files directly. No code changes needed.

Usage:
    from services.local_areas import get_area, list_all_areas

    get_area(suburb="Bondi Beach")       # → "Eastern Suburbs"
    get_area(postcode="2026")            # → "Eastern Suburbs"
    get_area(suburb="Wagga Wagga")       # → "Riverina"
    get_area(suburb="Unknown")           # → None
"""

from __future__ import annotations
import json
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def _load(filename: str) -> dict:
    path = os.path.join(_DATA_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)

# Loaded once at import time — fast for all subsequent lookups
_SUBURB_TO_AREA: dict[str, str] = _load("suburb_areas.json")
_POSTCODE_TO_AREA: dict[str, str] = _load("postcode_areas.json")


def get_area(suburb: str | None = None, postcode: str | None = None) -> str | None:
    """
    Return the local Chat Room area name for a given suburb or postcode.

    Postcode takes priority when available — postcodes are unambiguous, suburb
    names are not (e.g. Richmond exists in VIC and NSW, Glenelg in SA and VIC).
    Falls back to suburb lookup if postcode is absent or unrecognised.
    Returns None if no match is found.

    Examples:
        get_area(postcode="2026")             → "Eastern Suburbs - North"
        get_area(postcode="3121")             → "Yarra"           (VIC Richmond, not NSW)
        get_area(suburb="Bondi Beach")        → "Eastern Suburbs - North"
        get_area(suburb="Richmond", postcode="3121") → "Yarra"   (postcode wins)
        get_area(suburb="Wagga Wagga")        → "Wagga Wagga"
        get_area(suburb="Totally Unknown")    → None
    """
    if postcode:
        match = _POSTCODE_TO_AREA.get(str(postcode).strip())
        if match:
            return match

    if suburb:
        match = _SUBURB_TO_AREA.get(suburb.strip().lower())
        if match:
            return match

    return None


def list_all_areas() -> list[str]:
    """Return a sorted, deduplicated list of all area room names."""
    return sorted(set(_SUBURB_TO_AREA.values()) | set(_POSTCODE_TO_AREA.values()))


# Geographic postcode range — excludes PO boxes and mail centres.
# Australian geographic postcodes: 200–7999
# 8000–8999 = VIC non-geographic (mail centres, PO boxes)
# 9000–9999 = QLD non-geographic (mail centres, PO boxes)
# 1000–1999 = NSW non-geographic (mail exchanges) — also excluded
_GEO_MIN = 200
_GEO_MAX = 7999
_NSW_NONGEOGRAPHIC_MIN = 1000
_NSW_NONGEOGRAPHIC_MAX = 1999

def _is_geographic(pc: int) -> bool:
    if pc < _GEO_MIN or pc > _GEO_MAX:
        return False
    if _NSW_NONGEOGRAPHIC_MIN <= pc <= _NSW_NONGEOGRAPHIC_MAX:
        return False
    return True

# Pre-built reverse map: area_name → sorted list of geographic int postcodes
_AREA_TO_POSTCODES: dict[str, list[int]] = {}
for _pc, _area in _POSTCODE_TO_AREA.items():
    try:
        _ipc = int(_pc)
        if _is_geographic(_ipc):
            _AREA_TO_POSTCODES.setdefault(_area, []).append(_ipc)
    except ValueError:
        pass
for _area in _AREA_TO_POSTCODES:
    _AREA_TO_POSTCODES[_area].sort()


def _fmt_pc(n: int) -> str:
    """Format an integer postcode, padding NT/ACT 0xxx postcodes to 4 digits."""
    return f"{n:04d}" if n < 1000 else str(n)


def get_area_postcode_range(area_name: str) -> str | None:
    """
    Return a human-readable postcode range string for the given area name.
    Only geographic postcodes are considered (200–7999, excluding NSW mail exchanges).

    Examples:
        get_area_postcode_range("Eastern Suburbs - North") → "2022–2030"
        get_area_postcode_range("Manly")                   → "2092–2095"
        get_area_postcode_range("Darwin City")             → "0800–0801"
        get_area_postcode_range("Unknown Area")            → None
    """
    postcodes = _AREA_TO_POSTCODES.get(area_name)
    if not postcodes:
        return None
    lo, hi = postcodes[0], postcodes[-1]
    if lo == hi:
        return _fmt_pc(lo)
    return f"{_fmt_pc(lo)}–{_fmt_pc(hi)}"


def get_area_postcodes(area_name: str) -> list[int]:
    """Return the sorted list of integer postcodes that map to this area."""
    return list(_AREA_TO_POSTCODES.get(area_name, []))
