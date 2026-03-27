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
 * Full-screen blocking update modal — prevents all app interaction until the
 * user installs the update. Mounted at the app root so it covers every page.
 */
export default function UpdateBanner() {
  const { updateReady, applyUpdate } = useUpdateReady()

  // Lock body scroll while the modal is showing
  useEffect(() => {
    if (!updateReady) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [updateReady])

  if (!updateReady) return null

  return (
    /* Full-screen backdrop — blocks all touches beneath it */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-6 py-7 flex flex-col items-center text-center gap-4">
        <span className="text-4xl">⬆️</span>
        <div>
          <h2 className="text-charcoal text-lg font-bold">Update available</h2>
          <p className="text-charcoal/50 text-sm mt-1">Bug fixes and improvements — tap below to update and continue.</p>
        </div>
        <button
          onClick={applyUpdate}
          className="w-full bg-warning text-white font-bold text-sm py-3.5 rounded-xl active:scale-95 transition-transform"
        >
          Update Now
        </button>
      </div>
    </div>
  )
}
