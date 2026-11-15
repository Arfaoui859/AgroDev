#!/usr/bin/env python3
"""Derive the AgriVibe brand asset set from the supplied master emblem.

The master artwork (`assets/brand/agrivibe-logo-source.jpg`) is the reference
logo supplied by the product owner: a bronze/copper disc carrying a green leaf
and circuit motif. This script does NOT redraw that emblem. It:

  1. isolates the circular emblem from the flat page background,
  2. composites it at the correct scale/safe-zone for each Expo asset,
  3. derives a monochrome silhouette for the Android themed icon.

Run from `mobile/`:  python3 scripts/generate-brand-assets.py
"""
from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(os.path.join(HERE, "..", "assets"))
BRAND = os.path.join(ASSETS, "brand")
SOURCE = os.path.join(BRAND, "agrivibe-logo-source.jpg")

# Brand palette (dark green + natural green, per the identity brief).
DEEP_GREEN = (11, 59, 34)
DEEP_GREEN_LIGHT = (16, 82, 47)
NATURAL_GREEN = (74, 162, 95)

# Emblem geometry measured from the master artwork.
CX, CY, R_OUTER = 246.0, 237.0, 215.0


def load_emblem() -> Image.Image:
    """Return the circular emblem on a transparent canvas."""
    src = Image.open(SOURCE).convert("RGB")
    # Supersample the mask so the circular edge stays smooth after resize.
    scale = 4
    w, h = src.size
    mask = Image.new("L", (w * scale, h * scale), 0)
    ImageDraw.Draw(mask).ellipse(
        [
            (CX - R_OUTER) * scale,
            (CY - R_OUTER) * scale,
            (CX + R_OUTER) * scale,
            (CY + R_OUTER) * scale,
        ],
        fill=255,
    )
    mask = mask.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    out = src.copy()
    out.putalpha(mask)
    return out.crop(
        (int(CX - R_OUTER), int(CY - R_OUTER), int(CX + R_OUTER), int(CY + R_OUTER))
    )


def square_gradient(size: int) -> Image.Image:
    """Deep-green radial background used behind the icon."""
    img = Image.new("RGB", (size, size), DEEP_GREEN)
    px = img.load()
    half = size / 2
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - half, y - half) / half
            t = min(1.0, d)
            px[x, y] = tuple(
                round(DEEP_GREEN[i] * (1 - t) + DEEP_GREEN_LIGHT[i] * t) for i in range(3)
            )
    return img


def place(emblem: Image.Image, size: int, fraction: float, bg: Image.Image | None) -> Image.Image:
    side = round(size * fraction)
    art = emblem.resize((side, side), Image.LANCZOS)
    canvas = bg.copy() if bg is not None else Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if canvas.mode != "RGBA":
        canvas = canvas.convert("RGBA")
    off = (size - side) // 2
    canvas.alpha_composite(art, (off, off))
    return canvas


def monochrome(emblem: Image.Image, size: int, fraction: float) -> Image.Image:
    """White silhouette of the emblem for Android's themed icon."""
    side = round(size * fraction)
    art = emblem.resize((side, side), Image.LANCZOS)
    # Luminance drives opacity so the engraved detail survives as white ink.
    grey = art.convert("L").point(lambda v: 255 if v > 96 else int(v * 2.2))
    white = Image.new("RGBA", art.size, (255, 255, 255, 255))
    white.putalpha(grey)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - side) // 2
    canvas.alpha_composite(white, (off, off))
    return canvas


def save(img: Image.Image, name: str) -> None:
    path = os.path.join(ASSETS, name)
    img.save(path, "PNG", optimize=True)
    print(f"  {name:34s} {img.size[0]}x{img.size[1]}  {os.path.getsize(path):,} bytes")


def main() -> None:
    emblem = load_emblem()
    emblem.save(os.path.join(BRAND, "agrivibe-emblem.png"), "PNG", optimize=True)
    print(f"master emblem: {emblem.size[0]}x{emblem.size[1]}")

    print("Expo assets:")
    # App icon: emblem inside the Android/iOS safe zone on the brand green.
    save(place(emblem, 1024, 0.68, square_gradient(1024)), "icon.png")
    # Adaptive icon layers (Android crops to the middle ~66%).
    save(place(emblem, 1024, 0.62, None), "android-icon-foreground.png")
    save(square_gradient(1024), "android-icon-background.png")
    save(monochrome(emblem, 1024, 0.62), "android-icon-monochrome.png")
    # Splash: the emblem on transparency; app.json sets the green backdrop.
    save(place(emblem, 512, 0.92, None), "splash-icon.png")
    # Web favicon.
    save(place(emblem, 64, 0.94, None), "favicon.png")
    # Reusable in-app brand marks.
    save(place(emblem, 256, 0.96, None), os.path.join("brand", "agrivibe-mark.png"))


if __name__ == "__main__":
    main()
