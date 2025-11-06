import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

const LOGO_SRC =
  "https://cdn.builder.io/api/v1/image/assets%2F0f904b57ad02434e8487cb8b11b1714d%2Fc4631b24084a4df5a13a0a47fc57364b?format=webp&width=800";

export default function Logo({ size = 48, className = "", alt = "AgroGrowth logo" }: LogoProps) {
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
