import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { skipWaiting, clientsClaim } from 'workbox-core'

// Immediately take control of all clients when a new SW version installs.
// Without this, the new SW waits indefinitely in "waiting" state — causing
// the app to keep serving stale cached JS chunks after a deployment.
skipWaiting()
clientsClaim()

// Workbox precaching — manifest injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Remove outdated caches from previous builds to free storage
cleanupOutdatedCaches()

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)

// ── Push notifications ────────────────────────────────────────────────────

self.addEventListener('push', event => {
  let data = { title: 'SafeServ', body: 'You have a new alert', url: '/dashboard' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (e) {
    // ignore parse errors
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data:  { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
