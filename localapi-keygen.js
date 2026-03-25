const crypto = require('crypto');

// Curated printable alphabet — **do not include '='** here so the only '='s are the final '=='
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~!@#$%^&*+|:;?,./<>';

// Generate a cryptographically secure random string of `length` characters from `alphabet`.
// Uses rejection sampling to avoid modulo bias.
function randomString(length, alphabet) {
  if (!Number.isInteger(length) || length < 0) throw new TypeError('length must be a non-negative integer');
  const result = [];
  const aLen = alphabet.length;
  if (aLen === 0) throw new TypeError('alphabet must not be empty');

  const maxUnbiased = 256 - (256 % aLen); // bytes >= this are discarded to avoid bias

  while (result.length < length) {
    // read a chunk of random bytes (size chosen for efficiency)
    const buf = crypto.randomBytes(256);
    for (let i = 0; i < buf.length && result.length < length; i++) {
      const v = buf[i];
      if (v < maxUnbiased) {
        result.push(alphabet[v % aLen]);
      }
    }
  }

  return result.join('');
}

const core = randomString(400, ALPHABET);
const token = core + '==';

console.log(token);
console.log('core length:', core.length);        // should be 512
console.log('full token length:', token.length); // 512 + 2 ('==') = 514
