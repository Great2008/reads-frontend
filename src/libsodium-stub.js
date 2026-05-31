// Stub for libsodium-wrappers-sumo.
// The real library is loaded at runtime by @meshsdk/core only when a
// Cardano wallet extension is present (desktop only).
// On mobile this module is imported but never called, so a stub is safe.
const sodium = {
  ready: Promise.resolve(),
  crypto_sign_ed25519_sk_to_pk: () => { throw new Error('libsodium not available'); },
  crypto_sign_ed25519_pk_to_curve25519: () => { throw new Error('libsodium not available'); },
  crypto_sign_ed25519_sk_to_curve25519: () => { throw new Error('libsodium not available'); },
  crypto_scalarmult_base: () => { throw new Error('libsodium not available'); },
  crypto_scalarmult: () => { throw new Error('libsodium not available'); },
  crypto_sign_SECRETKEYBYTES: 64,
  crypto_sign_PUBLICKEYBYTES: 32,
  crypto_sign_SEEDBYTES: 32,
  from_hex: () => { throw new Error('libsodium not available'); },
  to_hex: () => { throw new Error('libsodium not available'); },
};
export default sodium;
export const ready = Promise.resolve();
