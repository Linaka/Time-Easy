import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const iconDir = join(root, "src-tauri", "icons");
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const sourceIcon = join(iconDir, "icon-source.png");
const tauriBinary = join(root, "node_modules", ".bin", process.platform === "win32" ? "tauri.cmd" : "tauri");

writeNormalizedPng(sourceIcon, renderIcon(1024), 1024, 1024);
execFileSync(tauriBinary, ["icon", sourceIcon], { stdio: "inherit" });

function renderIcon(size) {
  const scale = 2;
  const highSize = size * scale;
  const pixels = new Uint8ClampedArray(highSize * highSize * 4);
  const c = (value) => value * scale;

  fillRoundedRect(pixels, highSize, c(0), c(0), c(size), c(size), c(size * 0.2), [15, 23, 42, 255]);
  fillRoundedRect(pixels, highSize, c(size * 0.14), c(size * 0.16), c(size * 0.72), c(size * 0.68), c(size * 0.09), [248, 250, 252, 255]);
  fillRoundedRect(pixels, highSize, c(size * 0.14), c(size * 0.16), c(size * 0.72), c(size * 0.18), c(size * 0.09), [20, 184, 166, 255]);
  fillCircle(pixels, highSize, c(size * 0.29), c(size * 0.25), c(size * 0.025), [15, 23, 42, 255]);
  fillCircle(pixels, highSize, c(size * 0.71), c(size * 0.25), c(size * 0.025), [15, 23, 42, 255]);

  const slotColor = [203, 213, 225, 255];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      fillRoundedRect(
        pixels,
        highSize,
        c(size * (0.24 + column * 0.16)),
        c(size * (0.42 + row * 0.13)),
        c(size * 0.1),
        c(size * 0.055),
        c(size * 0.014),
        slotColor
      );
    }
  }

  fillCircle(pixels, highSize, c(size * 0.68), c(size * 0.67), c(size * 0.18), [20, 184, 166, 255]);
  fillCircle(pixels, highSize, c(size * 0.68), c(size * 0.67), c(size * 0.125), [240, 253, 250, 255]);
  strokeLine(pixels, highSize, c(size * 0.68), c(size * 0.67), c(size * 0.68), c(size * 0.57), c(size * 0.026), [15, 23, 42, 255]);
  strokeLine(pixels, highSize, c(size * 0.68), c(size * 0.67), c(size * 0.76), c(size * 0.71), c(size * 0.026), [15, 23, 42, 255]);

  return downsample(pixels, highSize, scale);
}

function fillRoundedRect(pixels, size, x, y, width, height, radius, color) {
  const x2 = x + width;
  const y2 = y + height;

  for (let py = Math.floor(y); py < Math.ceil(y2); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(x2); px += 1) {
      const dx = Math.max(x + radius - px, 0, px - (x2 - radius));
      const dy = Math.max(y + radius - py, 0, py - (y2 - radius));
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, size, px, py, color);
      }
    }
  }
}

function fillCircle(pixels, size, cx, cy, radius, color) {
  const radiusSquared = radius * radius;

  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function strokeLine(pixels, size, x1, y1, x2, y2, thickness, color) {
  const minX = Math.floor(Math.min(x1, x2) - thickness);
  const maxX = Math.ceil(Math.max(x1, x2) + thickness);
  const minY = Math.floor(Math.min(y1, y2) - thickness);
  const maxY = Math.ceil(Math.max(y1, y2) + thickness);
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
      const projectionX = x1 + t * (x2 - x1);
      const projectionY = y1 + t * (y2 - y1);
      const distanceSquared = (x - projectionX) ** 2 + (y - projectionY) ** 2;
      if (distanceSquared <= thickness * thickness) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function setPixel(pixels, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const index = (Math.floor(y) * size + Math.floor(x)) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function downsample(pixels, highSize, scale) {
  const size = highSize / scale;
  const output = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const sourceIndex = ((y * scale + sy) * highSize + x * scale + sx) * 4;
          totals[0] += pixels[sourceIndex];
          totals[1] += pixels[sourceIndex + 1];
          totals[2] += pixels[sourceIndex + 2];
          totals[3] += pixels[sourceIndex + 3];
        }
      }
      const targetIndex = (y * size + x) * 4;
      const samples = scale * scale;
      output[targetIndex] = Math.round(totals[0] / samples);
      output[targetIndex + 1] = Math.round(totals[1] / samples);
      output[targetIndex + 2] = Math.round(totals[2] / samples);
      output[targetIndex + 3] = Math.round(totals[3] / samples);
    }
  }

  return output;
}

function writePng(path, pixels, width, height) {
  mkdirSync(dirname(path), { recursive: true });
  const rawRows = [];

  for (let y = 0; y < height; y += 1) {
    rawRows.push(Buffer.from([0]));
    rawRows.push(Buffer.from(pixels.slice(y * width * 4, (y + 1) * width * 4)));
  }

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    chunk("IDAT", deflateSync(Buffer.concat(rawRows))),
    chunk("IEND", Buffer.alloc(0))
  ]);

  writeFileSync(path, png);
}

function writeNormalizedPng(path, pixels, width, height) {
  writePng(path, pixels, width, height);
  execFileSync("sips", ["-s", "format", "png", path, "--out", path], { stdio: "ignore" });
}


function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(Buffer.concat([typeBuffer, data])))
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}
