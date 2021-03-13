console.log("Hi, Service worker here just checkin in.  Here to help with caching!");

const APP_PREFIX = "BudgetTracker-";
const VERSION = "version_01";
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = "Data-cache-v1"
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "./assets/js/index.js",
    "./assets/js/idb.js",
    "./assets/css/styles.css",
    "./assets/icons/icon-96x96.png",
    "./assets/icons/icon-72x72.png",
    "./assets/icons/icon-128x128.png",
    "./assets/icons/icon-144x144.png",
    "./assets/icons/icon-152x152.png",
    "./assets/icons/icon-192x192.png",
    "./assets/icons/icon-384x384.png",
    "./assets/icons/icon-512x512.png",    
    

];



self.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log("installing cache : " + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    )
    self.skipWaiting();
})

self.addEventListener("activate", function (e) {
    e.waitUntil(
      caches.keys().then(function (keyList) {
        // `keyList` contains all cache names under your username.github.io
        // filter out ones that has this app prefix to create keeplist
        let cacheKeeplist = keyList.filter(function (key) {
          return key.indexOf(APP_PREFIX);
        })
        // add current cache name to keeplist
        cacheKeeplist.push(CACHE_NAME);
  
        return Promise.all(keyList.map(function (key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log("deleting cache : " + keyList[i] );
            return caches.delete(keyList[i]);
          }
        }));
      })
    );

    self.clients.claim();
  });


// Respond with cached resources

self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then(cache => {
          return fetch(e.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(e.request.url, response.clone());
              }

              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(e.request);
            });
        })
        .catch(err => console.log(err))
    );

    return;
  }

  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(response) {
        if (response) {
          return response;
        } else if (e.request.headers.get('accept').includes('text/html')) {
          // return the cached home page for all requests for html pages
          return caches.match('/');
        }
      });
    })
  );
});


// self.addEventListener("fetch", function (e) {
//   console.log("fetch request : " + e.request.url)
//   e.respondWith(
//     caches.match(e.request).then(function (request) {
//       if (request) { // if cache is available, respond with cache
//         console.log("responding with cache : " + e.request.url)
//         return request
//       } else {       // if there are no cache, try fetching request
//         console.log("file is not cached, fetching : " + e.request.url)
//         return fetch(e.request)
//       }

//       // You can omit if/else for console.log & put one line below like this too.
//       // return request || fetch(e.request)
//     })
//   )
// })
