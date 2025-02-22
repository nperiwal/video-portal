import React from 'react';

const VideoPlayer = ({ videoUrl }) => {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url) => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : url;
  };

  return (
    <div className="video-player">
      <iframe
        width="100%"
        height="480"
        src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer; 