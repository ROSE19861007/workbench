/* 工作台 · 分享版 Service Worker
   网络优先 + 离线兜底：永远先取线上最新版，断网时才用上次缓存。
   只管本站目录，跨域的云同步请求（api.github.com）完全不拦。 */
const CACHE = 'wb-share-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  if (req.url.indexOf(self.registration.scope) !== 0) return;
  e.respondWith(
    fetch(req, {cache:'reload'}).then(function(res){
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ return c.put(req, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || Response.error(); });
    })
  );
});
