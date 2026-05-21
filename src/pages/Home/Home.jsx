import { useMemo, useState } from 'react'
import './Home.css'

const previewSuggestions = [
  'Daft Punk',
  'Arctic Monkeys',
  'Beyonce',
  'The Weeknd',
]

export function Home() {
  const [artist, setArtist] = useState('')

  const visibleSuggestions = useMemo(() => {
    if (!artist.trim()) return previewSuggestions

    return previewSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(artist.toLowerCase()),
    )
  }, [artist])

  return (
    <main className="home-page">
      <section className="game-home" aria-labelledby="game-title">
        <div className="game-kicker">Music quiz</div>
        <h1 id="game-title">Guess the Music</h1>
        <p className="game-subtitle">
          Search for a band or artist to start a round and test your music memory.
        </p>

        <div className="search-panel">
          <label className="sr-only" htmlFor="artist-search">
            Type a band or artist
          </label>
          <input
            id="artist-search"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Type a band/Artist"
            type="search"
            autoComplete="off"
          />

          <div className="autocomplete" aria-label="Artist suggestions">
            {visibleSuggestions.length > 0 ? (
              visibleSuggestions.map((suggestion) => (
                <button
                  className="suggestion"
                  key={suggestion}
                  type="button"
                  onClick={() => setArtist(suggestion)}
                >
                  <span>{suggestion}</span>
                  <span className="suggestion-tag">Artist</span>
                </button>
              ))
            ) : (
              <div className="empty-state">No preview matches yet</div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
