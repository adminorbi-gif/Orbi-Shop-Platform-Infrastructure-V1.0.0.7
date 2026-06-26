import React, { useState, useEffect } from "react";

export function AppBarBackgroundSlider({ settings }: { settings: any }) {
  const backgrounds = [
    settings?.appBarBackground,
    settings?.appBarBackground2,
    settings?.appBarBackground3
  ].filter(Boolean) as string[];

  // Double the background items if there is only 1 picture, to allow seamless cross-fading of transition effects
  const bgList = backgrounds.length === 1 ? [backgrounds[0], backgrounds[0]] : backgrounds;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [effectIndex, setEffectIndex] = useState(0);

  // 10 different premium video-like cinematic transition effects
  const effects = [
    "animate-kb-zoomin",
    "animate-kb-zoomout",
    "animate-kb-panright",
    "animate-kb-panleft",
    "animate-kb-panup",
    "animate-kb-pandown",
    "animate-kb-tiltright",
    "animate-kb-tiltleft",
    "animate-kb-diagonalup",
    "animate-kb-diagonaldown"
  ];

  useEffect(() => {
    if (bgList.length === 0) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((prev) => (prev + 1) % bgList.length);
      setEffectIndex((prev) => (prev + 1) % effects.length);
    }, 8000); // 8 seconds intervals

    return () => clearInterval(interval);
  }, [currentIndex, bgList.length]);

  if (bgList.length === 0) {
    return null;
  }

  const animationStyles = `
    @keyframes kb-zoomin {
      0% { transform: scale(1) translate(0px, 0px); }
      100% { transform: scale(1.15) translate(8px, 4px); }
    }
    @keyframes kb-zoomout {
      0% { transform: scale(1.18) translate(-8px, -4px); }
      100% { transform: scale(1.02) translate(0px, 0px); }
    }
    @keyframes kb-panright {
      0% { transform: scale(1.1) translate(-12px, 0px); }
      100% { transform: scale(1.15) translate(12px, 0px); }
    }
    @keyframes kb-panleft {
      0% { transform: scale(1.1) translate(12px, 0px); }
      100% { transform: scale(1.15) translate(-12px, 0px); }
    }
    @keyframes kb-panup {
      0% { transform: scale(1.12) translate(0px, 8px); }
      100% { transform: scale(1.15) translate(0px, -8px); }
    }
    @keyframes kb-pandown {
      0% { transform: scale(1.12) translate(0px, -15px); }
      100% { transform: scale(1.15) translate(0px, 8px); }
    }
    @keyframes kb-tiltright {
      0% { transform: scale(1.05) rotate(0deg); }
      100% { transform: scale(1.18) rotate(2deg) translate(5px, 5px); }
    }
    @keyframes kb-tiltleft {
      0% { transform: scale(1.05) rotate(0deg); }
      100% { transform: scale(1.18) rotate(-2deg) translate(-5px, 5px); }
    }
    @keyframes kb-diagonalup {
      0% { transform: scale(1.1) translate(-10px, 10px); }
      100% { transform: scale(1.18) translate(10px, -10px); }
    }
    @keyframes kb-diagonaldown {
      0% { transform: scale(1.1) translate(10px, -10px); }
      100% { transform: scale(1.18) translate(-10px, 10px); }
    }
    .animate-kb-zoomin { animation: kb-zoomin 10s ease-in-out forwards; }
    .animate-kb-zoomout { animation: kb-zoomout 10s ease-in-out forwards; }
    .animate-kb-panright { animation: kb-panright 10s ease-in-out forwards; }
    .animate-kb-panleft { animation: kb-panleft 10s ease-in-out forwards; }
    .animate-kb-panup { animation: kb-panup 10s ease-in-out forwards; }
    .animate-kb-pandown { animation: kb-pandown 10s ease-in-out forwards; }
    .animate-kb-tiltright { animation: kb-tiltright 10s ease-in-out forwards; }
    .animate-kb-tiltleft { animation: kb-tiltleft 10s ease-in-out forwards; }
    .animate-kb-diagonalup { animation: kb-diagonalup 10s ease-in-out forwards; }
    .animate-kb-diagonaldown { animation: kb-diagonaldown 10s ease-in-out forwards; }
  `;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden transition-all duration-1000 z-0">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      {bgList.map((bg, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrev = idx === prevIndex;
        if (!isCurrent && !isPrev) return null;

        // Apply systematic animation class cycle to the current slide.
        const currentAnimation = settings?.disableAppBarAnimations
          ? ""
          : (isCurrent ? effects[effectIndex] : "animate-kb-zoomin");

        const isVideo = (url: string) => {
          if (!url) return false;
          const cleanUrl = url.toLowerCase().split(/[?#]/)[0];
          return (
            cleanUrl.endsWith(".mp4") ||
            cleanUrl.endsWith(".webm") ||
            cleanUrl.endsWith(".ogg") ||
            cleanUrl.endsWith(".mov") ||
            cleanUrl.endsWith(".quicktime") ||
            url.startsWith("data:video/")
          );
        };

        return (
          <div
            key={bg + "-" + idx}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              isCurrent ? "opacity-95 z-1" : "opacity-0 z-0"
            }`}
          >
            {isVideo(bg) ? (
              <video
                src={bg}
                autoPlay
                loop
                muted
                playsInline
                className={`w-full h-full object-cover blur-[1px] ${currentAnimation}`}
              />
            ) : (
              <img
                src={bg}
                alt="AppBar Background Slider"
                className={`w-full h-full object-cover blur-[1px] ${currentAnimation}`}
              />
            )}
          </div>
        );
      })}
      {/* Dynamic light gradient overlay with safe z-index below the menu content */}
      <div 
        className="absolute inset-0 z-2"
        style={{
          background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.15), rgba(15, 23, 42, 0.45))"
        }}
      />
    </div>
  );
}
