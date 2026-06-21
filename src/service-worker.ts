/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute([...build, ...files].map((url) => ({ url, revision: version })));
cleanupOutdatedCaches();

registerRoute(
	({ request }) => request.mode === 'navigate',
	new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 3 })
);

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
