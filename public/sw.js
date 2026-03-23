self.addEventListener('push', function(event) {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'SafeServ', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
