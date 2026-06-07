export function cx(...classes) {
  return classes.flat().filter(Boolean).join(" ");
}
