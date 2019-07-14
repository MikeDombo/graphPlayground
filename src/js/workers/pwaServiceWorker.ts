let dataCacheName = "graphs-v1";

let filesToCache = ["index.html"];

// @ts-ignore
const ctx: ServiceWorkerGlobalScope = self as any;

// @ts-ignore
ctx.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(
        caches
            .open(dataCacheName)
            .then(cache => cache.addAll(filesToCache))
            .then(() => ctx.skipWaiting())
    );
});

ctx.addEventListener("activate", () => {
    ctx.clients.claim();
});

// Get files from network first (cache if not cached already), then the cache
// @ts-ignore
ctx.addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (event.request.url.includes("chrome-extension://")) {
                    return response;
                }

                return caches.open(dataCacheName).then(cache => {
                    const newResp = response.clone();
                    // Check if the response is for a real URL, not base64 encoded data and it is a GET request
                    if (!newResp.url.includes("data:") && event.request.method === "GET") {
                        cache.put(event.request, newResp);
                    }
                    return response;
                });
            })
            .catch(() => {
                return caches.match(event.request) as Promise<Response>;
            })
    );
});
