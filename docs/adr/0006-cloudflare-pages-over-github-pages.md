# Cloudflare Workers over GitHub Pages

Cloudflare Workers (via `@sveltejs/adapter-cloudflare`) is used for hosting rather than GitHub Pages because PWA service workers require precise control over HTTP response headers (`Cache-Control`, `Service-Worker-Allowed`). GitHub Pages does not support custom headers. Cloudflare Workers supports them via a `_headers` file and provides better global CDN coverage at the same zero cost. Workers is Cloudflare's recommended deployment target over the older Pages product.
