import React from 'react';
import '../styles/VideoPlayer.css';

const VideoPlayer = ({ videoUrl }) => {
  // Check if it's a Bunny.net URL
  const isBunnyUrl = videoUrl.includes('bunny.net') || videoUrl.includes('mediadelivery.net');
  
  if (isBunnyUrl) {
    // Handle direct play URL format like:
    // https://iframe.mediadelivery.net/play/387883/5597529b-2438-424c-b7a4-07f842e2a4d6
    const embedUrl = videoUrl.includes('iframe.mediadelivery.net') 
      ? videoUrl 
      : `https://iframe.mediadelivery.net/play/${videoUrl}`;

    return (
      <div className="video-player">
        <iframe
          src={embedUrl}
          style={{ width: '100%', height: '100%' }}
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        ></iframe>
      </div>
    );
  }

  // Fallback for YouTube URLs
  const youtubeId = videoUrl.split('v=')[1];
  return (
    <div className="video-player">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        style={{ width: '100%', height: '100%' }}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayer; 