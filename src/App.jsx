import { useEffect, useState } from 'react'
import { Header } from './components/Header/Header'
import { Favorites } from './pages/Favorites/Favorites'
import { Home } from './pages/Home/Home'
import './App.css'

const STORAGE_KEYS = {
  theme: 'guess-the-music:theme',
  volume: 'guess-the-music:volume',
  effectsMuted: 'guess-the-music:effects-muted',
  favoriteArtists: 'guess-the-music:favorite-artists',
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

const getStoredEffectsMuted = () =>
  localStorage.getItem(STORAGE_KEYS.effectsMuted) === 'true'

const getStoredFavoriteArtists = () => {
  try {
    const storedFavorites = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.favoriteArtists) ?? '[]',
    )

    return Array.isArray(storedFavorites) ? storedFavorites : []
  } catch {
    return []
  }
}

function App() {
  const [theme, setTheme] = useState(getStoredTheme)
  const [volume, setVolume] = useState(getStoredVolume)
  const [effectsMuted, setEffectsMuted] = useState(getStoredEffectsMuted)
  const [preventRepeatTracks, setPreventRepeatTracks] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')
  const [favoriteArtists, setFavoriteArtists] = useState(getStoredFavoriteArtists)
  const [selectedFavoriteArtist, setSelectedFavoriteArtist] = useState(null)

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  const updateVolume = (nextVolume) => {
    setVolume(Math.min(Math.max(nextVolume, 0), 100))
  }

  const toggleEffectsMuted = () => {
    setEffectsMuted((currentValue) => !currentValue)
  }

  const togglePreventRepeatTracks = () => {
    setPreventRepeatTracks((currentValue) => !currentValue)
  }

  const toggleFavoriteArtist = (artist) => {
    setFavoriteArtists((currentFavorites) => {
      const isAlreadyFavorite = currentFavorites.some(
        (favoriteArtist) => favoriteArtist.id === artist.id,
      )

      if (isAlreadyFavorite) {
        return currentFavorites.filter((favoriteArtist) => favoriteArtist.id !== artist.id)
      }

      return [
        ...currentFavorites,
        {
          id: artist.id,
          name: artist.name,
          picture_small: artist.picture_small,
          picture_medium: artist.picture_medium,
          picture_big: artist.picture_big,
          picture_xl: artist.picture_xl,
        },
      ]
    })
  }

  const openFavoriteArtist = (artist) => {
    setSelectedFavoriteArtist({ ...artist, selectedAt: Date.now() })
    setCurrentPage('home')
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.volume, String(volume))
  }, [volume])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.effectsMuted, String(effectsMuted))
  }, [effectsMuted])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.favoriteArtists,
      JSON.stringify(favoriteArtists),
    )
  }, [favoriteArtists])

  return (
    <div className="app-root" data-theme={theme}>
      <Header
        activePage={currentPage}
        effectsMuted={effectsMuted}
        favoriteCount={favoriteArtists.length}
        preventRepeatTracks={preventRepeatTracks}
        theme={theme}
        volume={volume}
        onNavigate={setCurrentPage}
        onToggleEffectsMuted={toggleEffectsMuted}
        onTogglePreventRepeatTracks={togglePreventRepeatTracks}
        onThemeToggle={toggleTheme}
        onVolumeChange={updateVolume}
      />
      {currentPage === 'home' ? (
        <Home
          favoriteArtists={favoriteArtists}
          effectsMuted={effectsMuted}
          initialArtistQuery={selectedFavoriteArtist}
          onToggleFavoriteArtist={toggleFavoriteArtist}
          preventRepeatTracks={preventRepeatTracks}
          volume={volume}
        />
      ) : (
        <Favorites
          favoriteArtists={favoriteArtists}
          onSelectFavoriteArtist={openFavoriteArtist}
          onToggleFavoriteArtist={toggleFavoriteArtist}
        />
      )}
    </div>
  )
}

export default App
