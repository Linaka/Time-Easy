#!/usr/bin/env python3
"""Generate Creative Operations app and desktop icons from the selected logo."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "outputs/logos/creative-operations/selected/creative-operations-co-ligature-selected.png"
PUBLIC = ROOT / "public"
ICONS = ROOT / "src-tauri/icons"


def non_white_bbox(image: Image.Image, threshold: int = 32) -> tuple[int, int, int, int]:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a and max(255 - r, 255 - g, 255 - b) > threshold:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, rgba.width, rgba.height)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def crop_with_padding(
    image: Image.Image,
    bbox: tuple[int, int, int, int],
    padding: int,
) -> Image.Image:
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def white_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    result = Image.new("RGBA", rgba.size, (255, 255, 255, 0))
    pixels = rgba.load()
    out = result.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if not a:
                continue
            distance = max(255 - r, 255 - g, 255 - b)
            alpha = max(0, min(255, int((distance - 8) * 3.8)))
            if alpha:
                out[x, y] = (r, g, b, alpha)
    return result


def contain(image: Image.Image, size: tuple[int, int], padding: int = 0) -> Image.Image:
    canvas = Image.new("RGBA", size, (255, 255, 255, 0))
    target = (size[0] - padding * 2, size[1] - padding * 2)
    fitted = image.copy()
    fitted.thumbnail(target, Image.Resampling.LANCZOS)
    x = (size[0] - fitted.width) // 2
    y = (size[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def make_mac_icon(mark: Image.Image, size: int) -> Image.Image:
    icon = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    radius = int(size * 0.205)
    bg_box = int(size * 0.064)
    rect = (bg_box, bg_box, size - bg_box, size - bg_box)

    shadow = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        rect,
        radius=radius,
        fill=(15, 23, 42, 34),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.026))
    icon.alpha_composite(shadow)

    bg = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    bg_draw = ImageDraw.Draw(bg)
    bg_draw.rounded_rectangle(rect, radius=radius, fill=(255, 255, 255, 255))
    bg_draw.rounded_rectangle(
        rect,
        radius=radius,
        outline=(229, 231, 235, 255),
        width=max(1, size // 96),
    )
    icon.alpha_composite(bg)

    fitted = contain(mark, (size, size), padding=int(size * 0.18))
    icon.alpha_composite(fitted)
    return icon


def save_resized(source: Image.Image, path: Path, size: tuple[int, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    source.resize(size, Image.Resampling.LANCZOS).save(path)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGBA")
    full_bbox = non_white_bbox(source)
    logo = white_to_alpha(crop_with_padding(source, full_bbox, 36))

    mark_bbox = non_white_bbox(source.crop((0, 0, 710, source.height)))
    mark_bbox = (
        mark_bbox[0],
        mark_bbox[1],
        mark_bbox[2],
        mark_bbox[3],
    )
    mark = white_to_alpha(crop_with_padding(source.crop((0, 0, 710, source.height)), mark_bbox, 34))

    logo.save(PUBLIC / "creative-operations-logo.png")
    mark.save(PUBLIC / "creative-operations-mark.png")

    icon_source = make_mac_icon(mark, 1024)
    icon_source.save(PUBLIC / "creative-operations-app-icon.png")
    icon_source.save(ICONS / "icon-source.png")
    icon_source.save(ICONS / "icon.png")

    save_resized(icon_source, PUBLIC / "favicon.png", (64, 64))
    save_resized(icon_source, PUBLIC / "apple-touch-icon.png", (180, 180))

    for name, size in {
        "32x32.png": (32, 32),
        "64x64.png": (64, 64),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256),
    }.items():
        save_resized(icon_source, ICONS / name, size)

    windows_sizes = {
        "Square30x30Logo.png": (30, 30),
        "Square44x44Logo.png": (44, 44),
        "Square71x71Logo.png": (71, 71),
        "Square89x89Logo.png": (89, 89),
        "Square107x107Logo.png": (107, 107),
        "Square142x142Logo.png": (142, 142),
        "Square150x150Logo.png": (150, 150),
        "Square284x284Logo.png": (284, 284),
        "Square310x310Logo.png": (310, 310),
        "StoreLogo.png": (50, 50),
    }
    for name, size in windows_sizes.items():
        save_resized(icon_source, ICONS / name, size)

    iconset = ICONS / "icon.iconset"
    iconset.mkdir(parents=True, exist_ok=True)
    iconset_sizes = {
        "icon_16x16.png": (16, 16),
        "icon_16x16@2x.png": (32, 32),
        "icon_32x32.png": (32, 32),
        "icon_32x32@2x.png": (64, 64),
        "icon_128x128.png": (128, 128),
        "icon_128x128@2x.png": (256, 256),
        "icon_256x256.png": (256, 256),
        "icon_256x256@2x.png": (512, 512),
        "icon_512x512.png": (512, 512),
        "icon_512x512@2x.png": (1024, 1024),
    }
    for name, size in iconset_sizes.items():
        save_resized(icon_source, iconset / name, size)

    icon_source.save(
        ICONS / "icon.icns",
        sizes=[(16, 16), (32, 32), (64, 64), (128, 128), (256, 256), (512, 512), (1024, 1024)],
    )
    icon_source.save(ICONS / "icon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    print(f"logo={PUBLIC / 'creative-operations-logo.png'} {logo.size[0]}x{logo.size[1]}")
    print(f"mark={PUBLIC / 'creative-operations-mark.png'} {mark.size[0]}x{mark.size[1]}")
    print(f"mac_icon={ICONS / 'icon.icns'}")


if __name__ == "__main__":
    main()
