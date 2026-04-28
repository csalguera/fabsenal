"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

type CardImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

const FALLBACK_IMAGE = "/file.svg";

function normalizeInitialSrc(src: string) {
  // Treat missing or disallowed external sources as a local fallback.
  if (!src) {
    return FALLBACK_IMAGE;
  }

  if (src.includes("images.fabtcg.com")) {
    return FALLBACK_IMAGE;
  }

  return src;
}

export default function CardImage({
  src,
  alt,
  width,
  height,
  className,
}: CardImageProps) {
  const initialSrc = useMemo(() => normalizeInitialSrc(src), [src]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    // Smoothly restore the card to its resting pose after hover ends.
    const resetTransform = () => {
      gsap.to(frame, {
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        z: 0,
        boxShadow: "0 10px 24px rgba(29, 45, 75, 0.16)",
        duration: 0.28,
        ease: "power3.out",
      });
      frame.style.zIndex = "1";
    };

    // Map cursor position to 3D rotation so hovered edges move forward.
    const handlePointerMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const normalizedX = (offsetX / rect.width) * 2 - 1;
      const normalizedY = (offsetY / rect.height) * 2 - 1;

      gsap.to(frame, {
        scale: 1.01,
        rotateX: -normalizedY * 13,
        rotateY: normalizedX * 13,
        z: 64,
        transformPerspective: 1000,
        duration: 0.14,
        ease: "power3.out",
      });
    };

    const handlePointerEnter = () => {
      frame.style.zIndex = "40";
      gsap.set(frame, {
        transformPerspective: 1000,
        transformOrigin: "center center",
      });
    };

    frame.addEventListener("pointermove", handlePointerMove);
    frame.addEventListener("pointerenter", handlePointerEnter);
    frame.addEventListener("pointerleave", resetTransform);

    return () => {
      frame.removeEventListener("pointermove", handlePointerMove);
      frame.removeEventListener("pointerenter", handlePointerEnter);
      frame.removeEventListener("pointerleave", resetTransform);
    };
  }, []);

  return (
    <span
      key={initialSrc}
      className="card-image-frame"
      ref={frameRef}
      style={{ width, height }}
    >
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        unoptimized
        onError={() => setCurrentSrc(FALLBACK_IMAGE)}
      />
    </span>
  );
}
