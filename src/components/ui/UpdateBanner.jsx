import { useEffect, useState } from 'react'

/** Detects a waiting service worker and offers a one-tap update. */
function useUpdateReady() {
  const [waitingSW, setWaitingSW] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Check immediately — SW may already be waiting when page loads
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg?.waiting) setWaitingSW(reg.waiting)
    })

    // Listen for a new SW finishing installation
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        newSW?.addEventListener('statechange', (e) => {
          if (e.target.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(e.target)
          }
        })
      })
    })

    // When the new SW takes control, reload to use the fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  const applyUpdate = () => {
    if (!waitingSW) return
    waitingSW.postMessage({ type: 'SKIP_WAITING' })
  }

  return { updateReady: !!waitingSW, applyUpdate }
}

/**
 * Floating update card — appears at the bottom-centre of the screen,
 * safely above the mobile nav bar and iPhone home indicator.
 * Mounted at the app root so it shows on every page including the PIN picker.
 */
export default function UpdateBanner() {
  const { updateReady, applyUpdate } = useUpdateReady()

  if (!updateReady) return null

  return (
    <div
      className="fixed bottom-24 inset-x-0 z-[200] flex justify-center px-5 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto w-full max-w-sm bg-warning text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">⬆️</span>
          <div>
            <p className="text-sm font-semibold leading-tight">Update available</p>
            <p className="text-xs opacity-80 mt-0.5">Tap to get the latest version</p>
          </div>
        </div>
        <button
          onClick={applyUpdate}
          className="shrink-0 text-xs font-bold bg-white/25 hover:bg-white/35 active:scale-95 transition-all px-4 py-2 rounded-xl whitespace-nowrap"
        >
          Update
        </button>
      </div>
    </div>
  )
}
