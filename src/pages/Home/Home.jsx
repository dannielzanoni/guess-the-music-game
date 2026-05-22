import { useEffect, useState } from 'react'
import { searchArtists } from '../../services/api/deezerClient'
import './Home.css'

export function Home() {
  const [artist, setArtist] = useState('')
  const [artistSuggestions, setArtistSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const normalizedArtist = artist.trim()
  const shouldShowAutocomplete = normalizedArtist.length >= 2

  const handleArtistChange = (event) => {
    const nextArtist = event.target.value

    setArtist(nextArtist)

    if (nextArtist.trim().length < 2) {
      setArtistSuggestions([])
      setSuggestionError('')
      setIsLoadingSuggestions(false)
    }
  }

  useEffect(() => {
    if (!shouldShowAutocomplete) {
      return undefined
    }

    const controller = new AbortController()
    const debounceId = window.setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true)
        setSuggestionError('')

        const artists = await searchArtists(normalizedArtist, controller.signal)
        setArtistSuggestions(artists)
      } catch (error) {
        if (controller.signal.aborted || error.name === 'CanceledError') return

        setArtistSuggestions([])
        setSuggestionError('Could not load artists right now')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(debounceId)
    }
  }, [normalizedArtist, shouldShowAutocomplete])

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
            onChange={handleArtistChange}
            placeholder="Type a Band/Artist"
            type="search"
            autoComplete="off"
          />

          {shouldShowAutocomplete && (
            <div className="autocomplete" aria-label="Artist suggestions">
              {isLoadingSuggestions && (
                <div className="empty-state">Searching artists...</div>
              )}

              {!isLoadingSuggestions &&
                artistSuggestions.map((suggestion) => (
                  <button
                    className="suggestion"
                    key={suggestion.id}
                    type="button"
                    onClick={() => setArtist(suggestion.name)}
                  >
                    <span className="suggestion-main">
                      {suggestion.picture_small && (
                        <img src={suggestion.picture_small} alt="" />
                      )}
                      <span>{suggestion.name}</span>
                    </span>
                    <span className="suggestion-tag">Artist</span>
                  </button>
                ))}

              {!isLoadingSuggestions &&
                !suggestionError &&
                artistSuggestions.length === 0 && (
                  <div className="empty-state">No artists found</div>
                )}

              {!isLoadingSuggestions && suggestionError && (
                <div className="empty-state">{suggestionError}</div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
