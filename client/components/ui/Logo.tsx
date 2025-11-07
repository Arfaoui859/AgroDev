import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

const LOGO_SRC =
  "https://cdn.builder.io/api/v1/image/assets%2F0f904b57ad02434e8487cb8b11b1714d%2F9fdfcfc7836f42c4bf789cb564019ceb?format=webp&width=800";

export default function Logo({ size = 64, className = "", alt = "AgroGrowth logo" }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={"object-contain " + className}
      style={{ display: "inline-block" }}
    />
  );
}
