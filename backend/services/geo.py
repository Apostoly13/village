"""
Geographical utility functions — distance, bounding box, geocoding.
No database dependency; pure computation + optional external API call.
"""
import math
import httpx


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in km between two lat/lon points (Haversine)."""
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bounding_box(lat: float, lon: float, distance_km: float) -> dict:
    """
    Return a lat/lon bounding box for a circle of radius distance_km.
    Use to pre-filter MongoDB documents before exact Haversine check.
    Returns: {"lat": {"$gte": ..., "$lte": ...}, "lon": {"$gte": ..., "$lte": ...}}
    """
    lat_delta = distance_km / 111.0
    cos_lat = math.cos(math.radians(lat))
    lon_delta = distance_km / (111.0 * cos_lat) if cos_lat != 0 else 180.0
    return {
        "lat_min": lat - lat_delta,
        "lat_max": lat + lat_delta,
        "lon_min": lon - lon_delta,
        "lon_max": lon + lon_delta,
    }


async def geocode_address(address: str, state: str = None) -> dict:
    """Geocode an address using OpenStreetMap Nominatim (free, no API key)."""
    try:
        search_query = f"{address}, {state}, Australia" if state else f"{address}, Australia"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": search_query, "format": "json", "limit": 1, "countrycodes": "au"},
                headers={"User-Agent": "TheVillage/1.0"},
                timeout=5.0,
            )
            if response.status_code == 200:
                results = response.json()
                if results:
                    return {
                        "lat": float(results[0]["lat"]),
                        "lon": float(results[0]["lon"]),
                        "display_name": results[0].get("display_name", ""),
                    }
    except Exception:
        pass
    return {}
