const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | undefined;

function bufferFrom(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function getCryptoConfig(): Promise<{
  subtle: SubtleCrypto;
  key: CryptoKey;
  iv: ArrayBuffer;
}> {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  if (typeof clientId !== "string" || clientId.length < 32) {
    throw new Error("VITE_CLIENT_ID must contain at least 32 characters.");
  }

  const keyBytes = bufferFrom(encoder.encode(clientId.slice(-32)));
  const iv = bufferFrom(encoder.encode(clientId.slice(-16)));

  if (keyBytes.byteLength !== 32 || iv.byteLength !== 16) {
    throw new Error("The derived key and IV must be 32 and 16 UTF-8 bytes.");
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto is unavailable. Use HTTPS or localhost.");
  }

  keyPromise ??= subtle
    .importKey("raw", keyBytes, "AES-CBC", false, ["encrypt", "decrypt"])
    .catch((error: unknown) => {
      keyPromise = undefined;
      throw error;
    });

  return { subtle, key: await keyPromise, iv };
}

export async function encryptPayload(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  if (json === undefined) {
    throw new Error("Payload must be JSON-serializable.");
  }

  const { subtle, key, iv } = await getCryptoConfig();
  const encrypted = await subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    bufferFrom(encoder.encode(json)),
  );

  const bytes = new Uint8Array(encrypted);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export async function decryptPayload<T = unknown>(encryptedPayload: string): Promise<T> {
  if (
    typeof encryptedPayload !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encryptedPayload)
  ) {
    throw new Error("Encrypted payload must be standard Base64 ciphertext.");
  }

  let binary: string;
  try {
    binary = atob(encryptedPayload);
  } catch {
    throw new Error("Encrypted payload contains invalid Base64.");
  }

  if (binary.length === 0 || binary.length % 16 !== 0) {
    throw new Error("AES-CBC ciphertext must contain complete 16-byte blocks.");
  }

  const cipher = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(cipher);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const { subtle, key, iv } = await getCryptoConfig();
  const decrypted = await subtle.decrypt({ name: "AES-CBC", iv }, key, cipher);
  const json = new TextDecoder("utf-8", { fatal: true }).decode(decrypted);
  return JSON.parse(json) as T;
}
