/** Preserve a Pages project prefix and accept both /studio-demo and /studio-demo/. */
export function viewerPageUrl(baseUrl) {
  const base = new URL(baseUrl);
  if (!base.pathname.endsWith('/') && !/\.html?$/i.test(base.pathname)) base.pathname += '/';
  return new URL('viewer.html', base);
}
