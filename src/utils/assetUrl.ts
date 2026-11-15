/**
 * Resolves root-relative public asset URLs (e.g. "/images/hero_after.jpg")
 * against the active document base URI so assets work both at root domains
 * (Vercel, custom domain) and subpath deployments (GitHub Pages /repo-name/).
 */
export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    if (typeof document !== 'undefined' && document.baseURI) {
      try {
        return new URL(trimmed.slice(1), document.baseURI).pathname;
      } catch {
        return `.${trimmed}`;
      }
    }
    return `.${trimmed}`;
  }
  return trimmed;
}
