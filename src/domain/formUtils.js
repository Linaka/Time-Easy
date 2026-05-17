import { isSafeDisplayText } from "../timeUtils.js";

export function setFormValue(setter, key, value) {
  setter((current) => ({ ...current, [key]: value }));
}

export function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function validatePlainFields(values) {
  const hasUnsafeField = values.some((value) => value && !isSafeDisplayText(String(value)));
  return hasUnsafeField ? "Script-like text is blocked for safety. Please enter plain text." : "";
}

export function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `item-${Date.now()}`;
}
