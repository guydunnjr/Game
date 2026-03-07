export async function ensureManifestFresh() {
  return {
    updated: false,
    reason: 'Manifest refresh disabled in this version.'
  };
}
