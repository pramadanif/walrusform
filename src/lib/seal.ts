/**
 * lib/seal.ts — Seal encryption integration (MVP placeholder)
 *
 * Full Seal SDK integration requires @mysten/seal SDK and a running Seal node.
 * For the MVP, we implement the data flow correctly and mark the encryption
 * boundary with clear placeholder comments.
 *
 * Status:
 *   - encryptWithSeal: base64 placeholder (marks data as needing Seal)
 *   - decryptWithSeal: reverses the placeholder
 *
 * To upgrade to real Seal:
 *   1. npm install @mysten/seal
 *   2. Follow https://docs.walrus.site/seal
 *   3. Replace SEAL_ENCRYPTED: prefix with real SealClient.encrypt() call
 */

export async function encryptWithSeal(
  data: string,
  allowedDecryptors: string[] // array of Sui wallet addresses
): Promise<string> {
  // TODO: Integrate real @mysten/seal SDK
  // const client = new SealClient({ ... });
  // const policy = await client.createPolicy({ allowedDecryptors });
  // return client.encrypt(data, policy);

  console.warn(
    '[Seal] Encryption is using MVP placeholder. Real Seal SDK integration pending.',
    { allowedDecryptors }
  );
  return `SEAL_ENCRYPTED:${btoa(unescape(encodeURIComponent(data)))}`;
}

export async function decryptWithSeal(
  ciphertext: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _walletAdapter?: any
): Promise<string> {
  if (ciphertext.startsWith('SEAL_ENCRYPTED:')) {
    // MVP placeholder: reverse the base64 encoding
    return decodeURIComponent(escape(atob(ciphertext.replace('SEAL_ENCRYPTED:', ''))));
  }
  // TODO: Real Seal decryption
  // const client = new SealClient({ ... });
  // return client.decrypt(ciphertext, walletAdapter);
  throw new Error('Seal decryption: unrecognized ciphertext format');
}
