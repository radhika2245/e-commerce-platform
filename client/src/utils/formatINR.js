export default function formatINR(n) {
  const str = String(Math.round(n));
  if (str.length <= 3) return str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const chunks = [];
  let r = rest;
  while (r.length > 0) {
    chunks.push(r.slice(-2));
    r = r.slice(0, -2);
  }
  return chunks.reverse().join(',') + ',' + last3;
}
