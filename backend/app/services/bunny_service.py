import os
import requests
from typing import Optional
import json

class BunnyService:
    def __init__(self):
        self.api_key = os.getenv('BUNNY_API_KEY')
        self.library_id = os.getenv('BUNNY_LIBRARY_ID')
        self.base_url = os.getenv('BUNNY_BASE_URL')
        self.stream_url = os.getenv('BUNNY_STREAM_URL')
        
        self.headers = {
            "Accept": "application/json",
            "AccessKey": self.api_key
        }

    async def upload_video(self, file, title: str) -> Optional[dict]:
        """Upload a video to Bunny.net"""
        try:
            # Create the video object
            create_url = f"{self.base_url}/{self.library_id}/videos"
            create_data = {
                "title": title,
                "collectionId": self.library_id
            }
            
            response = requests.post(
                create_url,
                headers=self.headers,
                json=create_data
            )
            response.raise_for_status()
            video_data = response.json()
            
            # Upload the actual video file
            upload_url = f"{self.base_url}/{self.library_id}/videos/{video_data['guid']}"
            files = {
                'video': (file.filename, file.file, 'video/mp4')
            }
            
            response = requests.put(
                upload_url,
                headers={"AccessKey": self.api_key},
                files=files
            )
            response.raise_for_status()
            
            # Return the video URL
            return {
                "video_id": video_data['guid'],
                "url": f"{self.stream_url}/{self.library_id}/{video_data['guid']}/play",
                "thumbnail": f"{self.stream_url}/{self.library_id}/{video_data['guid']}/thumbnail.jpg"
            }
            
        except Exception as e:
            print(f"Error uploading to Bunny.net: {str(e)}")
            return None

    async def delete_video(self, video_id: str) -> bool:
        """Delete a video from Bunny.net"""
        try:
            url = f"{self.base_url}/{self.library_id}/videos/{video_id}"
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Error deleting from Bunny.net: {str(e)}")
            return False

    async def get_video_info(self, video_id: str) -> Optional[dict]:
        """Get video information from Bunny.net"""
        try:
            url = f"{self.base_url}/{self.library_id}/videos/{video_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting video info from Bunny.net: {str(e)}")
            return None 