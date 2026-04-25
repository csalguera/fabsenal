"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type CardImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

const FALLBACK_IMAGE = "/file.svg";

function normalizeInitialSrc(src: string) {
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

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      onError={() => setCurrentSrc(FALLBACK_IMAGE)}
    />
  );
}
