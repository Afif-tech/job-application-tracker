/**
 * Minimal duration parser: converts strings like "15m", "7d", "3600s",
 * "12h" into milliseconds. A plain number is treated as milliseconds.
 * Mirrors the subset of the `ms` package we actually use for JWT expiries.
 */
const UNITS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

module.exports = function ms(value) {
  if (typeof value === 'number') return value;
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid duration string: ${value}`);
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2] || 'ms';
  return amount * UNITS[unit];
};
