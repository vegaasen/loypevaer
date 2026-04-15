import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="reload-prompt">
      <span>Ny versjon tilgjengelig</span>
      <button onClick={() => void updateServiceWorker(true)}>Last inn på nytt</button>
      <button className="reload-prompt__dismiss" onClick={() => setNeedRefresh(false)}>
        ✕
      </button>
    </div>
  )
}
