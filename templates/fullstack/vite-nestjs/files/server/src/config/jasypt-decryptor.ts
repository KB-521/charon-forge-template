import { createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto';
import { TextDecoder } from 'node:util';

const PATTERN = /^ENC\((.*)\)$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function isJasyptEncryptedValue(value: unknown): value is string {
  return typeof value === 'string' && PATTERN.test(value);
}

export function decryptJasyptValue(value: string, password: string): string {
  if (!password)
    throw new Error('JASYPT_PASSWORD is required when an encrypted configuration value is used');
  const encoded = PATTERN.exec(value)?.[1] ?? '';
  if (!encoded || !BASE64.test(encoded))
    throw new Error('Unable to decrypt encrypted configuration value');
  const ciphertext = Buffer.from(encoded, 'base64');
  if (ciphertext.length === 0 || ciphertext.length % 16 !== 0)
    throw new Error('Unable to decrypt encrypted configuration value');
  const passwordBytes = Buffer.from(password.normalize('NFC'), 'utf8');
  const saltAndIv = Buffer.from(
    createHash('md5').update(password, 'utf8').digest('hex').slice(8, 24),
    'utf8',
  );
  let key: Buffer | undefined;
  try {
    key = pbkdf2Sync(passwordBytes, saltAndIv, 1_000, 32, 'sha512');
    const decipher = createDecipheriv('aes-256-cbc', key, saltAndIv);
    return new TextDecoder('utf-8', { fatal: true }).decode(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]),
    );
  } catch {
    throw new Error('Unable to decrypt encrypted configuration value');
  } finally {
    passwordBytes.fill(0);
    saltAndIv.fill(0);
    ciphertext.fill(0);
    key?.fill(0);
  }
}

function decryptModernPayload(encoded: string, password: string): string {
  const payload = Buffer.from(encoded, 'base64');
  const passwordBytes = Buffer.from(password.normalize('NFC'), 'utf8');
  let key: Buffer | undefined;
  try {
    const bodyLength = payload.length - 32;
    if (bodyLength <= 0 || bodyLength % 16 !== 0) throw new Error();
    key = pbkdf2Sync(passwordBytes, payload.subarray(0, 16), 1_000, 32, 'sha512');
    const decipher = createDecipheriv('aes-256-cbc', key, payload.subarray(16, 32));
    return Buffer.concat([decipher.update(payload.subarray(32)), decipher.final()]).toString(
      'utf8',
    );
  } finally {
    payload.fill(0);
    passwordBytes.fill(0);
    key?.fill(0);
  }
}

export function decryptIfEncrypted(value: string, password = process.env.JASYPT_PASSWORD): string {
  const encoded = PATTERN.exec(value.trim())?.[1];
  if (encoded === undefined) return value;
  if (!password || !encoded || !BASE64.test(encoded))
    throw new Error('Failed to decrypt ENC value');
  try {
    return decryptModernPayload(encoded, password);
  } catch {
    return decryptJasyptValue(`ENC(${encoded})`, password);
  }
}
