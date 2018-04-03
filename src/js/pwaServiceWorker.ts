let dataCacheName = 'graphs-v1';

let filesToCache = [
    'index.html'
];

self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(dataCacheName).then((cache) => cache.addAll(filesToCache))
    );
});

// Get files from network first (cache if not cached already), then the cache
self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (event.request.url.includes("chrome-extension://")) {
                    return response;
                }

                return caches.open(dataCacheName).then(cache => {
                    const newResp = response.clone();
                    // Check if the response is for a real URL, not base64 encoded data
                    if (!newResp.url.includes("data:")) {
                        cache.put(event.request, newResp);
                    }
                    return response;
                });
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
