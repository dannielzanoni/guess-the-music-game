import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import './AudioWaveform.css'

const fallbackBars = [
  22, 38, 28, 50, 34, 44, 18, 56, 42, 26, 48, 32, 54, 24, 36, 46, 30, 52, 20,
  40, 58, 28, 44, 34, 50, 22, 38, 48, 26, 54, 32, 42,
]

export function AudioWaveform({ audioUrl, currentTime, previewDuration, resetKey }) {
  const containerRef = useRef(null)
  const waveSurferRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasWaveformError, setHasWaveformError] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 520px)')
    const updateViewportMode = () => setIsMobileViewport(mediaQuery.matches)

    updateViewportMode()
    mediaQuery.addEventListener('change', updateViewportMode)

    return () => {
      mediaQuery.removeEventListener('change', updateViewportMode)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || !audioUrl || isMobileViewport) return undefined

    setIsReady(false)
    setHasWaveformError(false)

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 56,
      waveColor: 'rgba(167, 173, 183, 0.48)',
      progressColor: '#7dffb2',
      cursorWidth: 0,
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      barMinHeight: 2,
      minPxPerSec: 80,
      normalize: true,
      fillParent: true,
      interact: false,
      dragToSeek: false,
      backend: 'MediaElement',
    })

    waveSurferRef.current = waveSurfer
    waveSurfer.on('ready', () => setIsReady(true))
    waveSurfer.on('error', () => setHasWaveformError(true))
    waveSurfer.load(audioUrl).catch((error) => {
      if (error.name !== 'AbortError') {
        setHasWaveformError(true)
      }
    })

    return () => {
      waveSurfer.destroy()
      waveSurferRef.current = null
    }
  }, [audioUrl, resetKey, isMobileViewport])

  useEffect(() => {
    if (!isReady || !waveSurferRef.current) return

    waveSurferRef.current.setTime(currentTime)
  }, [currentTime, isReady])

  return (
    <div className="audio-waveform">
      {!isMobileViewport && (
        <div className="audio-waveform-container" ref={containerRef} />
      )}

      {!isMobileViewport && !isReady && !hasWaveformError && (
        <div className="audio-waveform-loading" aria-hidden="true" />
      )}

      {(isMobileViewport || hasWaveformError) && (
        <div className="audio-waveform-fallback" aria-hidden="true">
          {fallbackBars.map((height, index) => (
            <span
              className={
                index / fallbackBars.length <= currentTime / previewDuration
                  ? 'is-active'
                  : ''
              }
              key={`${height}-${index}`}
              style={{ height }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
