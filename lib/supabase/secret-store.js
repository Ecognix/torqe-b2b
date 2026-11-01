import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getEncryptionKey() {
  const encoded = process.env.CONSOLE_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error("Set CONSOLE_ENCRYPTION_KEY before saving customer AI credentials.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("CONSOLE_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function encryptSecret(value) {
  if (typeof value !== "string" || !value) throw new Error("Cannot encrypt an empty credential.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value) {
  if (typeof value !== "string") throw new Error("Stored provider credential is invalid.");
  const [version, encodedIv, encodedTag, encodedData, ...extra] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedTag || !encodedData || extra.length) {
    throw new Error("Stored provider credential uses an unsupported format.");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const tag = Buffer.from(encodedTag, "base64url");
  const encrypted = Buffer.from(encodedData, "base64url");
  if (iv.length !== 12 || tag.length !== 16 || !encrypted.length) {
    throw new Error("Stored provider credential is malformed.");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (error) {
    throw new Error(`Could not decrypt the stored provider credential: ${error.message}`);
  }
}
