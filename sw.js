// SW Version
const version = "1.0";

// Static Assest to Cacje - APP Shell
const appAssets = [
  "index.html",
  "main.js",
  "images/flame.png",
  "images/logo.png",
  "images/sync.png",
  "vendor/bootstrap.min.css",
  "vendor/jquery.min.js"
];

// SW Install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(`static-${version}`).then(cache => cache.addAll(appAssets))
  );
});

// SW Activate
self.addEventListener("activate", e => {
  // clean static cache
  let cleaned = caches.keys().then(keys => {
    keys.forEach(key => {
      if (key !== `static-${version}` && key.match("static-")) {
        return caches.delete(key);
      }
    });
  });

  e.waitUntil(cleaned);
});

// Static Cache - Cache with network fallback
const staticCache = (req, cacheName = `static-${version}`) => {
  return caches.match(req).then(cachedRes => {
    // Return cached response if found
    if (cachedRes) return cachedRes;

    // Fallback to network
    return fetch(req).then(networkRes => {
      // Update cache with new response
      caches.open(cacheName).then(cache => cache.put(req, networkRes));

      // Return clone of network response
      return networkRes.clone();
    });
  });
};

// Network with cache fallback
const fallbackCache = req => {
  // Try Network
  return (
    fetch(req)
      .then(networkRes => {
        // Check if res is OK, else go to cache
        if (!networkRes.ok) throw "fetch error";

        // Update cache
        caches
          .open(`static-${version}`)
          .then(cache => cache.put(req, networkRes));

        // Return a clone of newwork response
        return networkRes.clone();
      })
      // Try Cache
      .catch(err => caches.match(req))
  );
};

// Clean old Giphys from "giphy" cache
const cleanGiphyCache = giphys => {
  caches.open("giphy").then(cache => {
    cache.keys().then(keys => {
      // Loop entries
      keys.forEach(key => {
        if (!giphys.includes(key.url)) cache.delete(key);
      });
    });
  });
};

// SW Fetch
self.addEventListener("fetch", e => {
  // App shell
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  }
  // Giphy API
  else if (e.request.url.match("api.giphy.com/v1/gifs/trending")) {
    e.respondWith(fallbackCache(e.request));
  }
  // Giphy Media (images)
  else if (e.request.url.match("giphy.com/media")) {
    e.respondWith(staticCache(e.request, "giphy"));
  }
});

// Listen for message from client
self.addEventListener("message", e => {
  // Identify the message
  if (e.data.action === "cleanGiphyCache") cleanGiphyCache(e.data.giphys);
});
