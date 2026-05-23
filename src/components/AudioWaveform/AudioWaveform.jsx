import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import './AudioWaveform.css'

const fallbackBars = [28, 44, 32, 52, 36, 46, 24, 58, 40, 34, 50, 30, 48, 38]

export function AudioWaveform({ audioUrl, currentTime, previewDuration, resetKey }) {
  const containerRef = useRef(null)
  const waveSurferRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasWaveformError, setHasWaveformError] = useState(false)
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return undefined

    setIsReady(false)
    setHasWaveformError(false)

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 48,
      waveColor: 'rgba(167, 173, 183, 0.48)',
      progressColor: '#7dffb2',
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      barMinHeight: 2,
      normalize: true,
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
  }, [audioUrl, resetKey])

  useEffect(() => {
    if (!isReady || !waveSurferRef.current) return

    waveSurferRef.current.setTime(currentTime)
  }, [currentTime, isReady])

  return (
    <div className="audio-waveform">
      <div className="audio-waveform-container" ref={containerRef} />

      {!isReady && !hasWaveformError && (
        <div className="audio-waveform-loading" aria-hidden="true" />
      )}

      {hasWaveformError && (
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
