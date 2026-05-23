import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from '@hiseb/confetti'
import { AudioWaveform } from '../../components/AudioWaveform/AudioWaveform'
import {
  getArtistTopTracks,
  normalizeSearchText,
  searchArtists,
} from '../../services/api/deezerClient'
import tadaSound from '../../assets/sounds/tada_sound.mp3'
import './Home.css'

const MAX_ATTEMPTS = 5

const getRandomTrack = (tracks) => tracks[Math.floor(Math.random() * tracks.length)]

const getTrackTitle = (track) => track.title_short || track.title

export function Home({ volume }) {
  const audioRef = useRef(null)
  const successAudioRef = useRef(null)
  const playTimeoutRef = useRef(null)
  const lastCelebratedGuessRef = useRef('')

  const [artist, setArtist] = useState('')
  const [artistSuggestions, setArtistSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const [selectedArtist, setSelectedArtist] = useState(null)
  const [tracks, setTracks] = useState([])
  const [roundTrack, setRoundTrack] = useState(null)
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [trackError, setTrackError] = useState('')

  const [guess, setGuess] = useState('')
  const [isGuessFocused, setIsGuessFocused] = useState(false)
  const [wrongGuesses, setWrongGuesses] = useState([])
  const [extraSecondRequests, setExtraSecondRequests] = useState([])
  const [correctGuess, setCorrectGuess] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [waveformResetKey, setWaveformResetKey] = useState(0)

  const normalizedArtist = artist.trim()
  const isSelectedArtistSearch = selectedArtist?.name === normalizedArtist
  const shouldShowAutocomplete = normalizedArtist.length >= 2 && !isSelectedArtistSearch
  const attemptsUsed = wrongGuesses.length + extraSecondRequests.length
  const previewDuration = Math.min(1 + attemptsUsed, 1 + MAX_ATTEMPTS)
  const hasFinishedRound = Boolean(correctGuess) || attemptsUsed >= MAX_ATTEMPTS

  const guessSuggestions = useMemo(() => {
    if (!isGuessFocused || hasFinishedRound) return []

    const normalizedGuess = normalizeSearchText(guess.trim())

    return tracks
      .filter((track) => {
        if (!normalizedGuess) return true

        return normalizeSearchText(getTrackTitle(track)).includes(normalizedGuess)
      })
      .slice(0, 5)
  }, [guess, hasFinishedRound, isGuessFocused, tracks])

  const stopPreview = () => {
    window.clearTimeout(playTimeoutRef.current)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setPreviewCurrentTime(0)
    setIsPlaying(false)
  }

  const startNewSong = (availableTracks = tracks) => {
    stopPreview()
    setRoundTrack(getRandomTrack(availableTracks))
    setGuess('')
    setWrongGuesses([])
    setExtraSecondRequests([])
    setCorrectGuess('')
    setIsGuessFocused(false)
  }

  const handleArtistChange = (event) => {
    const nextArtist = event.target.value

    setArtist(nextArtist)

    if (selectedArtist && nextArtist.trim() !== selectedArtist.name) {
      stopPreview()
      setSelectedArtist(null)
      setTracks([])
      setRoundTrack(null)
      setTrackError('')
      setGuess('')
      setWrongGuesses([])
      setExtraSecondRequests([])
      setCorrectGuess('')
    }

    if (nextArtist.trim().length < 2) {
      setArtistSuggestions([])
      setSuggestionError('')
      setIsLoadingSuggestions(false)
    }
  }

  const handleArtistSelect = async (selectedSuggestion) => {
    const controller = new AbortController()

    setArtist(selectedSuggestion.name)
    setArtistSuggestions([])
    setSelectedArtist(selectedSuggestion)
    setTracks([])
    setRoundTrack(null)
    setTrackError('')
    setIsLoadingTracks(true)
    setWrongGuesses([])
    setExtraSecondRequests([])
    setCorrectGuess('')
    setGuess('')
    stopPreview()

    try {
      const artistTracks = await getArtistTopTracks(selectedSuggestion, controller.signal)
      const playableTracks = artistTracks.filter((track) => track.preview)

      setTracks(playableTracks)

      if (playableTracks.length > 0) {
        setRoundTrack(getRandomTrack(playableTracks))
      } else {
        setTrackError('No playable previews found for this artist')
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        setTrackError('Could not load songs for this artist')
      }
    } finally {
      setIsLoadingTracks(false)
    }
  }

  const playPreview = async () => {
    if (!audioRef.current || !roundTrack?.preview) return

    stopPreview()

    audioRef.current.volume = volume / 100
    audioRef.current.currentTime = 0
    setPreviewCurrentTime(0)
    setWaveformResetKey((currentKey) => currentKey + 1)

    try {
      await audioRef.current.play()
      setIsPlaying(true)

      playTimeoutRef.current = window.setTimeout(() => {
        stopPreview()
      }, previewDuration * 1000)
    } catch {
      setIsPlaying(false)
    }
  }

  const handlePreviewTimeUpdate = () => {
    if (!audioRef.current) return

    setPreviewCurrentTime(audioRef.current.currentTime)

    if (audioRef.current.currentTime >= previewDuration) {
      stopPreview()
    }
  }

  const playCorrectAnswerFeedback = () => {
    const centerPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.28,
    }

    confetti({
      position: centerPosition,
      count: 140,
      size: 1.2,
      velocity: 280,
      fade: true,
    })

    window.setTimeout(() => {
      confetti({
        position: centerPosition,
        count: 90,
        size: 1,
        velocity: 220,
        fade: true,
      })
    }, 180)

    if (!successAudioRef.current) return

    successAudioRef.current.pause()
    successAudioRef.current.currentTime = 0
    successAudioRef.current.volume = Math.max(volume / 100, 0.2)
    successAudioRef.current.play().catch((error) => {
      console.warn('Could not play success sound', error)
    })
  }

  const validateGuess = (nextGuess) => {
    if (!roundTrack || hasFinishedRound || !nextGuess.trim()) return

    const normalizedGuess = normalizeSearchText(nextGuess.trim())
    const normalizedTrackTitle = normalizeSearchText(roundTrack.title)
    const normalizedShortTitle = normalizeSearchText(getTrackTitle(roundTrack))
    const isCorrectGuess =
      normalizedGuess === normalizedTrackTitle || normalizedGuess === normalizedShortTitle

    if (isCorrectGuess) {
      setCorrectGuess(getTrackTitle(roundTrack))
      setIsGuessFocused(false)
      stopPreview()
      playCorrectAnswerFeedback()
      return
    }

    setWrongGuesses((currentGuesses) =>
      [...currentGuesses, nextGuess.trim()].slice(0, MAX_ATTEMPTS),
    )
    setGuess('')
  }

  const handleExtraSecondRequest = () => {
    if (hasFinishedRound) return

    stopPreview()
    setExtraSecondRequests((currentRequests) => [
      ...currentRequests,
      currentRequests.length + 1,
    ])
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }

    if (successAudioRef.current) {
      successAudioRef.current.volume = Math.max(volume / 100, 0.2)
    }
  }, [volume])

  useEffect(() => {
    if (!correctGuess || lastCelebratedGuessRef.current === correctGuess) return

    lastCelebratedGuessRef.current = correctGuess
    confetti({
      count: 80,
      size: 1,
      velocity: 200,
      fade: true,
    })
  }, [correctGuess])

  useEffect(() => {
    if (!audioRef.current) return

    stopPreview()
    audioRef.current.load()
  }, [roundTrack])

  useEffect(() => {
    const handleWaveformAbort = (event) => {
      const reason = event.reason
      const isWaveformAbort =
        reason?.name === 'AbortError' &&
        reason?.message === 'signal is aborted without reason'

      if (isWaveformAbort) {
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleWaveformAbort)

    return () => {
      window.removeEventListener('unhandledrejection', handleWaveformAbort)
    }
  }, [])

  useEffect(() => () => stopPreview(), [])

  return (
    <main className="home-page">
      <audio ref={successAudioRef} src={tadaSound} preload="auto" />

      <section className="game-home" aria-labelledby="game-title">
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
                    onClick={() => handleArtistSelect(suggestion)}
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

      {selectedArtist && (
        <section className="round-panel" aria-label="Guess the selected song">
          <div className="artist-card">
            <img
              src={selectedArtist.picture_big || selectedArtist.picture_medium}
              alt={selectedArtist.name}
            />
            <h2>{selectedArtist.name}</h2>

            <div className="attempt-list" aria-live="polite">
              {wrongGuesses.map((wrongGuess, index) => (
                <span className="attempt-label is-wrong" key={`${wrongGuess}-${index}`}>
                  {wrongGuess}
                </span>
              ))}

              {correctGuess && (
                <span className="attempt-label is-correct">{correctGuess}</span>
              )}
            </div>
          </div>

          <div className="song-card">
            {isLoadingTracks && <div className="empty-state">Loading songs...</div>}
            {!isLoadingTracks && trackError && (
              <div className="empty-state">{trackError}</div>
            )}

            {!isLoadingTracks && roundTrack && (
              <>
                <div className="song-status">
                  <strong>{previewDuration}s</strong>
                  <div className="preview-waveform" aria-hidden="true">
                    <AudioWaveform
                      audioUrl={roundTrack.preview}
                      currentTime={previewCurrentTime}
                      previewDuration={previewDuration}
                      resetKey={waveformResetKey}
                    />
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={roundTrack.preview}
                  onEnded={() => setIsPlaying(false)}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  preload="auto"
                />

                <button className="play-button" type="button" onClick={playPreview}>
                  {isPlaying ? 'Playing...' : `Play ${previewDuration}s Preview`}
                </button>

                <div className="guess-form">
                  <label className="sr-only" htmlFor="song-guess">
                    Guess the song
                  </label>
                  <input
                    id="song-guess"
                    value={guess}
                    disabled={hasFinishedRound}
                    onBlur={() => window.setTimeout(() => setIsGuessFocused(false), 120)}
                    onChange={(event) => setGuess(event.target.value)}
                    onFocus={() => setIsGuessFocused(true)}
                    placeholder="Guess the song"
                    type="search"
                    autoComplete="off"
                  />
                  <button
                    className="extra-second-button"
                    disabled={hasFinishedRound}
                    type="button"
                    onClick={handleExtraSecondRequest}
                  >
                    +1s
                  </button>

                  {guessSuggestions.length > 0 && (
                    <div className="song-autocomplete" aria-label="Song suggestions">
                      {guessSuggestions.map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => validateGuess(getTrackTitle(track))}
                        >
                          {getTrackTitle(track)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="attempt-counter">
                  {attemptsUsed}/{MAX_ATTEMPTS} attempts used
                </p>

                {attemptsUsed >= MAX_ATTEMPTS && !correctGuess && (
                  <p className="round-message is-wrong">
                    The song was {getTrackTitle(roundTrack)}
                  </p>
                )}

                {correctGuess && (
                  <p className="round-message is-correct">Correct answer</p>
                )}

                {hasFinishedRound && (
                  <button
                    className="new-song-button"
                    type="button"
                    onClick={() => startNewSong()}
                  >
                    New Song
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
