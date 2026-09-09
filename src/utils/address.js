/**
 * Pi Network / Stellar Address Validation and Sanitization Utility
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Strips leading/trailing whitespace and control characters.
 */
export function sanitizeAddress(address) {
  if (typeof address !== 'string') return '';
  return address.trim().replace(/\0/g, '');
}

/**
 * Decodes an RFC 4648 Base32 string into a Uint8 byte array.
 */
export function decodeBase32(str) {
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < str.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(str[i]);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return output;
}

/**
 * Calculates the CRC16-XMODEM checksum of a byte buffer.
 * Standard used by Stellar/Pi Network StrKey encoding.
 */
export function crc16xmodem(buf) {
  let crc = 0x0000;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

/**
 * Strictly validates whether an address is a standard Pi Network public key (G...).
 * Returns null if valid, or a descriptive error string if invalid.
 */
export function validateStandardAddress(address) {
  const addr = sanitizeAddress(address);

  if (!addr) {
    return 'Please enter a standard wallet address.';
  }

  if (addr.startsWith('S') && addr.length === 56) {
    return 'Secret keys are not accepted. Enter a standard public key (G...).';
  }

  if (addr.startsWith('M')) {
    return 'Muxed addresses (M...) are not supported. Enter a standard public key (G...).';
  }

  if (!addr.startsWith('G')) {
    return "Invalid address. Standard public key must start with 'G'.";
  }

  if (addr.length !== 56) {
    return `Invalid address length (${addr.length} chars). Standard public keys are exactly 56 characters.`;
  }

  if (!/^[A-Z2-7]+$/.test(addr)) {
    return 'Invalid address characters. Only uppercase base32 (A-Z, 2-7) are allowed.';
  }

  const decoded = decodeBase32(addr);
  if (!decoded || decoded.length !== 35) {
    return 'Invalid address encoding.';
  }

  // Version byte for account ID / ed25519 public key is 6 << 3 = 48 (0x30)
  if (decoded[0] !== 48) {
    return 'Invalid address type. Expected Ed25519 public key.';
  }

  const payload = decoded.slice(0, 33);
  const expectedChecksum = decoded[33] | (decoded[34] << 8); // little-endian CRC16
  const actualChecksum = crc16xmodem(payload);

  if (actualChecksum !== expectedChecksum) {
    return 'Invalid address checksum. The provided public key is not a valid Pi Network address.';
  }

  return null;
}

/**
 * Returns boolean true if the address is a valid standard public key.
 */
export function isValidStandardAddress(address) {
  return validateStandardAddress(address) === null;
}
