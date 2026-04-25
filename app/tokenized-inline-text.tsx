import Image from "next/image";
import type { ReactNode } from "react";

export type InlineTokenImageConfig = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type InlineTokenMap = Record<string, InlineTokenImageConfig>;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderTokenizedInlineText(
  text: string,
  tokenMap: InlineTokenMap,
): ReactNode {
  const tokens = Object.keys(tokenMap);
  if (tokens.length === 0) {
    return text;
  }

  const tokenRegex = new RegExp(`(${tokens.map(escapeRegex).join("|")})`, "g");
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    const tokenConfig = tokenMap[part];
    if (!tokenConfig) {
      return part;
    }

    return (
      <span key={`${part}-${index}`} className="inline-token-wrap">
        <Image
          src={tokenConfig.src}
          alt={tokenConfig.alt}
          width={tokenConfig.width}
          height={tokenConfig.height}
          className="inline-token-image"
        />
      </span>
    );
  });
}
