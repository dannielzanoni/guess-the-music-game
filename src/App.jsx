import { useEffect, useState } from 'react'
import { Header } from './components/Header/Header'
import { Home } from './pages/Home/Home'
import './App.css'

const STORAGE_KEYS = {
  theme: 'guess-the-music:theme',
  volume: 'guess-the-music:volume',
}

const getStoredTheme = () => {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme)

  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
}

const getStoredVolume = () => {
  const storedValue = localStorage.getItem(STORAGE_KEYS.volume)

  if (storedValue === null) return 80

  const storedVolume = Number(storedValue)

  if (Number.isNaN(storedVolume)) return 80

  return Math.min(Math.max(storedVolume, 0), 100)
}

function App() {
  const [theme, setTheme] = useState(getStoredTheme)
  const [volume, setVolume] = useState(getStoredVolume)

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  const updateVolume = (nextVolume) => {
    setVolume(Math.min(Math.max(nextVolume, 0), 100))
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.volume, String(volume))
  }, [volume])

  return (
    <div className="app-root" data-theme={theme}>
      <Header
        theme={theme}
        volume={volume}
        onThemeToggle={toggleTheme}
        onVolumeChange={updateVolume}
      />
      <Home volume={volume} />
    </div>
  )
}

export default App
