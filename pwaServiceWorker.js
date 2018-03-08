let dataCacheName = 'graphs-v1';

let filesToCache = [
	'index.html',
	'js/require.js',
	'js/main.js',
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(dataCacheName).then(function (cache) {
			return cache.addAll(filesToCache);
		})
	);
});

// Get files from network first (cache if not cached already), then the cache
self.addEventListener('fetch', function (event) {
	event.respondWith(
		fetch(event.request)
			.then(response => {
				return caches.open(dataCacheName).then(cache => {
					let newResp = response.clone();
					// Check if the response is for a real URL, not base64 encoded data
					if(!newResp.url.includes("data:")){
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
