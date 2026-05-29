import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from '@hiseb/confetti'
import { AudioWaveform } from '../../components/AudioWaveform/AudioWaveform'
import { KeyboardSpaceIcon } from '../../components/icons/KeyboardSpaceIcon'
import {
  getArtistTopTracks,
  normalizeSearchText,
  searchArtists,
} from '../../services/api/deezerClient'
import errorSound from '../../assets/sounds/error_sound.mp3'
import tadaSound from '../../assets/sounds/tada_sound.mp3'
import './Home.css'

const MAX_ATTEMPTS = 5

const getRandomTrack = (tracks) => tracks[Math.floor(Math.random() * tracks.length)]

const getAvailableTracks = (tracks, usedTrackIds, currentTrackId) => {
  const blockedTrackIds = new Set(usedTrackIds)

  if (currentTrackId) {
    blockedTrackIds.add(currentTrackId)
  }

  const availableTracks = tracks.filter((track) => !blockedTrackIds.has(track.id))

  if (availableTracks.length > 0) return availableTracks

  const tracksWithoutCurrent = tracks.filter((track) => track.id !== currentTrackId)

  return tracksWithoutCurrent.length > 0 ? tracksWithoutCurrent : tracks
}

const getTrackTitle = (track) => track.title_short || track.title

const formatPreviewTime = (seconds) => `${seconds.toFixed(2)}s`

export function Home({
  effectsMuted,
  favoriteArtists,
  initialArtistQuery,
  onToggleFavoriteArtist,
  preventRepeatTracks,
  volume,
}) {
  const audioRef = useRef(null)
  const errorAudioRef = useRef(null)
  const successAudioRef = useRef(null)
  const playButtonRef = useRef(null)
  const playTimeoutRef = useRef(null)
  const previewAnimationRef = useRef(null)
  const lastCelebratedGuessRef = useRef('')
  const lastFailedRoundRef = useRef(null)

  const [artist, setArtist] = useState(initialArtistQuery?.name ?? '')
  const [artistSuggestions, setArtistSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const [selectedArtist, setSelectedArtist] = useState(initialArtistQuery ?? null)
  const [tracks, setTracks] = useState([])
  const [roundTrack, setRoundTrack] = useState(null)
  const [usedTrackIds, setUsedTrackIds] = useState([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(Boolean(initialArtistQuery?.id))
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
  const shouldForceGuess = attemptsUsed >= MAX_ATTEMPTS - 1 && !hasFinishedRound
  const isSelectedArtistFavorite = favoriteArtists.some(
    (favoriteArtist) => favoriteArtist.id === selectedArtist?.id,
  )

  const guessSuggestions = useMemo(() => {
    if (!isGuessFocused || hasFinishedRound) return []

    const normalizedGuess = normalizeSearchText(guess.trim())
    const guessedTrackNames = new Set(
      [...wrongGuesses, correctGuess].filter(Boolean).map(normalizeSearchText),
    )

    return tracks
      .filter((track) => !guessedTrackNames.has(normalizeSearchText(getTrackTitle(track))))
      .filter((track) => {
        if (!normalizedGuess) return true

        return normalizeSearchText(getTrackTitle(track)).includes(normalizedGuess)
      })
      .slice(0, 5)
  }, [correctGuess, guess, hasFinishedRound, isGuessFocused, tracks, wrongGuesses])

  const stopPreview = () => {
    window.clearTimeout(playTimeoutRef.current)
    window.cancelAnimationFrame(previewAnimationRef.current)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setPreviewCurrentTime(0)
    setIsPlaying(false)
  }

  const syncPreviewTime = () => {
    if (!audioRef.current || audioRef.current.paused) return

    setPreviewCurrentTime(audioRef.current.currentTime)
    previewAnimationRef.current = window.requestAnimationFrame(syncPreviewTime)
  }

  const startNewSong = (availableTracks = tracks) => {
    stopPreview()

    const completedTrackIds = preventRepeatTracks && roundTrack
      ? [...new Set([...usedTrackIds, roundTrack.id])]
      : usedTrackIds
    const nextTrackOptions = getAvailableTracks(
      availableTracks,
      preventRepeatTracks ? completedTrackIds : [],
      roundTrack?.id,
    )

    setUsedTrackIds(
      preventRepeatTracks && completedTrackIds.length < availableTracks.length
        ? completedTrackIds
        : [],
    )
    setRoundTrack(getRandomTrack(nextTrackOptions))
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
      setUsedTrackIds([])
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
    setUsedTrackIds([])
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
      previewAnimationRef.current = window.requestAnimationFrame(syncPreviewTime)

      playTimeoutRef.current = window.setTimeout(() => {
        stopPreview()
      }, previewDuration * 1000)
    } catch {
      setIsPlaying(false)
    }
  }

  const handlePreviewTimeUpdate = () => {
    if (!audioRef.current) return

    if (audioRef.current.currentTime >= previewDuration) {
      stopPreview()
    }
  }

  const playEffectSound = useCallback((audioElement, audioSrc, label) => {
    if (effectsMuted) return

    const soundVolume = Math.max(volume / 100, 0.2)
    const effectAudio = audioElement ?? new Audio(audioSrc)

    effectAudio.pause()
    effectAudio.currentTime = 0
    effectAudio.muted = false
    effectAudio.volume = soundVolume

    effectAudio.play().catch((error) => {
      console.warn(`Could not play ${label} sound with preloaded audio`, error)

      const fallbackAudio = new Audio(audioSrc)
      fallbackAudio.muted = false
      fallbackAudio.volume = soundVolume
      fallbackAudio.play().catch((fallbackError) => {
        console.warn(`Could not play ${label} sound fallback`, fallbackError)
      })
    })
  }, [effectsMuted, volume])

  const playSuccessSound = useCallback(() => {
    playEffectSound(successAudioRef.current, tadaSound, 'success')
  }, [playEffectSound])

  const playErrorSound = useCallback(() => {
    playEffectSound(errorAudioRef.current, errorSound, 'error')
  }, [playEffectSound])

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

    playSuccessSound()
  }

  const validateGuess = (nextGuess) => {
    if (!roundTrack || hasFinishedRound || !nextGuess.trim()) return

    setGuess(nextGuess.trim())

    const normalizedGuess = normalizeSearchText(nextGuess.trim())
    const normalizedTrackTitle = normalizeSearchText(roundTrack.title)
    const normalizedShortTitle = normalizeSearchText(getTrackTitle(roundTrack))
    const isCorrectGuess =
      normalizedGuess === normalizedTrackTitle || normalizedGuess === normalizedShortTitle

    if (isCorrectGuess) {
      if (preventRepeatTracks) {
        setUsedTrackIds((currentTrackIds) => [
          ...new Set([...currentTrackIds, roundTrack.id]),
        ])
      }

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
    if (hasFinishedRound || shouldForceGuess) return

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
    if (!initialArtistQuery?.id) return undefined

    const controller = new AbortController()

    const loadFavoriteArtistTracks = async () => {
      try {
        const artistTracks = await getArtistTopTracks(
          initialArtistQuery,
          controller.signal,
        )
        const playableTracks = artistTracks.filter((track) => track.preview)

        if (controller.signal.aborted) return

        setTracks(playableTracks)

        if (playableTracks.length > 0) {
          setRoundTrack(getRandomTrack(playableTracks))
        } else {
          setTrackError('No playable previews found for this artist')
        }
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'CanceledError') {
          setTrackError('Could not load songs for this artist')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTracks(false)
        }
      }
    }

    loadFavoriteArtistTracks()

    return () => {
      controller.abort()
    }
  }, [initialArtistQuery])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }

    if (successAudioRef.current) {
      successAudioRef.current.volume = effectsMuted ? 0 : Math.max(volume / 100, 0.2)
    }
  }, [effectsMuted, volume])

  useEffect(() => {
    const handleSpacePlay = (event) => {
      const target = event.target
      const isTypingTarget =
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (
        event.code !== 'Space' ||
        isTypingTarget ||
        !roundTrack ||
        hasFinishedRound
      ) {
        return
      }

      event.preventDefault()
      playButtonRef.current?.click()
    }

    window.addEventListener('keydown', handleSpacePlay)

    return () => {
      window.removeEventListener('keydown', handleSpacePlay)
    }
  }, [roundTrack, hasFinishedRound])

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
    if (
      !roundTrack ||
      correctGuess ||
      attemptsUsed < MAX_ATTEMPTS ||
      lastFailedRoundRef.current === roundTrack.id
    ) {
      return
    }

    lastFailedRoundRef.current = roundTrack.id
    playErrorSound()
  }, [attemptsUsed, correctGuess, playErrorSound, roundTrack])

  useEffect(() => {
    if (!audioRef.current) return

    stopPreview()
    audioRef.current.load()
    lastFailedRoundRef.current = null
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
      <audio ref={errorAudioRef} src={errorSound} preload="auto" />
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
            <div className="artist-image-frame">
              <img
                src={selectedArtist.picture_big || selectedArtist.picture_medium}
                alt={selectedArtist.name}
              />
              <button
                className={`favorite-toggle ${
                  isSelectedArtistFavorite ? 'is-favorite' : ''
                }`}
                type="button"
                aria-label={
                  isSelectedArtistFavorite
                    ? `Remove ${selectedArtist.name} from favorites`
                    : `Add ${selectedArtist.name} to favorites`
                }
                onClick={() => onToggleFavoriteArtist(selectedArtist)}
              >
                <i
                  className={`pi ${
                    isSelectedArtistFavorite ? 'pi-star-fill' : 'pi-star'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
            <h2>{selectedArtist.name}</h2>
          </div>

          <div className="song-card">
            {isLoadingTracks && <div className="empty-state">Loading songs...</div>}
            {!isLoadingTracks && trackError && (
              <div className="empty-state">{trackError}</div>
            )}

            {!isLoadingTracks && roundTrack && (
              <>
                <div className="song-status">
                  <strong>
                    {formatPreviewTime(previewCurrentTime)} /{' '}
                    {formatPreviewTime(previewDuration)}
                  </strong>
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

                <button
                  className="play-button"
                  type="button"
                  ref={playButtonRef}
                  onClick={playPreview}
                >
                  <KeyboardSpaceIcon size={22} />
                  <span>
                    {isPlaying ? 'Playing...' : `Play ${previewDuration}s Preview`}
                  </span>
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
                    disabled={hasFinishedRound || shouldForceGuess}
                    type="button"
                    onClick={handleExtraSecondRequest}
                  >
                    <i className="pi pi-plus" aria-hidden="true" />
                    <span>1s</span>
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

                {shouldForceGuess && (
                  <p className="round-message is-warning">
                    Choose a song for your final attempt
                  </p>
                )}

                {attemptsUsed >= MAX_ATTEMPTS && !correctGuess && (
                  <p className="round-message is-wrong">
                    <strong>The song was: {getTrackTitle(roundTrack)}</strong>
                  </p>
                )}

                {correctGuess && (
                  <p className="round-message is-correct">Correct answer!</p>
                )}

                {hasFinishedRound && (
                  <button
                    className="new-song-button"
                    type="button"
                    onClick={() => startNewSong()}
                  >
                    <i className="pi pi-refresh" aria-hidden="true" />
                    <span>New Song</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="attempt-box">
            <div className="attempt-box-header">
              <h3>Attempts</h3>
              <div
                className="attempt-hearts"
                aria-label={`${attemptsUsed}/${MAX_ATTEMPTS} attempts used`}
                title={`${attemptsUsed}/${MAX_ATTEMPTS} attempts used`}
              >
                {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => {
                  const isRemainingAttempt = index < MAX_ATTEMPTS - attemptsUsed

                  return (
                    <i
                      className={`pi ${
                        isRemainingAttempt ? 'pi-heart-fill' : 'pi-heart'
                      }`}
                      key={index}
                      aria-hidden="true"
                    />
                  )
                })}
              </div>
            </div>
            <ol className="attempt-list" aria-live="polite">
              {wrongGuesses.map((wrongGuess, index) => (
                <li className="attempt-label is-wrong" key={`${wrongGuess}-${index}`}>
                  <span>{wrongGuess}</span>
                </li>
              ))}

              {correctGuess && (
                <li className="attempt-label is-correct">
                  <span>{correctGuess}</span>
                </li>
              )}

              {wrongGuesses.length === 0 && !correctGuess && (
                <li className="attempt-empty">No guesses yet</li>
              )}
            </ol>
          </div>
        </section>
      )}
    </main>
  )
}
