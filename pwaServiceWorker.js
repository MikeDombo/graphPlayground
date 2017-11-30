let dataCacheName = 'graphs-v1';

let filesToCache = [
	'index.html',
	'js/require.js',
	'js/main.js',
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(dataCacheName).then(function(cache) {
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener('activate', function (e){
	caches.keys();
	e.waitUntil(
		caches.keys().then(function (cacheNames){
			return Promise.all(cacheNames.map(function (thisCacheName){
				if(thisCacheName !== dataCacheName){
					return caches.delete(thisCacheName);
				}
			}));
		})
	);
});

// Get files from network first, then the cache
self.addEventListener('fetch', function(event) {
	event.respondWith(
		fetch(event.request).catch(function() {
			return caches.match(event.request);
		})
	);
});
