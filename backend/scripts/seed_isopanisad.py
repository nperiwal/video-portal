from bson import ObjectId
from datetime import datetime

def seed_isopanisad_content(db):
    # Use the same video URL for testing
    VIDEO_ID = "1f7914f7-d63c-4a80-84b4-1286f002aa90"
    LIBRARY_ID = "387887"
    VIDEO_URL = f"https://iframe.mediadelivery.net/play/{LIBRARY_ID}/{VIDEO_ID}"
    
    # Create the album
    album = {
        "_id": ObjectId(),
        "title": "Sri Isopanisad",
        "description": "A series of lectures on Sri Isopanisad by His Divine Grace A.C. Bhaktivedanta Swami Prabhupada",
        "created_by": ObjectId("67bab1e2ece9927dcf021311"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "video_count": 10,
        "is_active": True
    }
    
    # Insert the album
    db.albums.insert_one(album)
    
    # Video titles and descriptions
    video_data = [
        ("Introduction", "Introduction to Sri Isopanisad - Understanding the importance of Vedic knowledge"),
        ("Mantra 1", "Everything belongs to the Lord - Understanding divine proprietorship"),
        ("Mantra 2", "Working in devotion - The path of karma-yoga"),
        ("Mantra 3", "The demonic nature - Understanding asuric consciousness"),
        ("Mantra 4", "The Supreme Lord's energies - Understanding God's powers"),
        ("Mantra 5", "The paradox of God's personality - Far away yet very near"),
        ("Mantra 6", "Seeing everything in relation to the Supreme"),
        ("Mantra 7", "Perfect knowledge through service attitude"),
        ("Mantra 8", "The absolute nature of the Supreme Person"),
        ("Conclusion", "Summary and practical application of Sri Isopanisad's teachings")
    ]
    
    # Create videos
    videos = [
        {
            "_id": ObjectId(),
            "title": f"Sri Isopanisad - {title}",
            "description": description,
            "url": VIDEO_URL,
            "album_id": str(album["_id"]),
            "created_by": ObjectId("67bab1e2ece9927dcf021311"),
            "video_id": VIDEO_ID,
            "library_id": LIBRARY_ID,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        for title, description in video_data
    ]
    
    # Insert all videos
    db.videos.insert_many(videos)
    
    return {
        "album_id": str(album["_id"]),
        "video_count": len(videos)
    } 