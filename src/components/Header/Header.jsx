import { useRef, useState } from 'react'
import gtmIcon from '../../assets/icons/icon-gtm.png'
import './Header.css'

export function Header({
  activePage,
  effectsMuted,
  favoriteCount,
  theme,
  volume,
  onNavigate,
  onToggleEffectsMuted,
  onThemeToggle,
  onVolumeChange,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsButtonRef = useRef(null)
  const settingsDrawerRef = useRef(null)

  const closeSettings = () => {
    if (settingsDrawerRef.current?.contains(document.activeElement)) {
      settingsButtonRef.current?.focus()
    }

    setIsSettingsOpen(false)
  }

  return (
    <>
      <header className="app-header">
        <button
          className="brand"
          type="button"
          aria-label="Guess the Music home"
          onClick={() => onNavigate('home')}
        >
          <span className="brand-mark" aria-hidden="true">
            GTM
            <img className="brand-icon" src={gtmIcon} alt="" aria-hidden="true" />
          </span>
          <span>Guess the Music</span>
        </button>

        <nav className="header-actions" aria-label="Main navigation">
          <button
            className={`nav-button ${activePage === 'favorites' ? 'is-active' : ''}`}
            type="button"
            onClick={() => onNavigate('favorites')}
          >
            <i className="pi pi-star-fill" aria-hidden="true" />
            <span>Favorites</span>
            {favoriteCount > 0 && <strong>{favoriteCount}</strong>}
          </button>

          <button
            className="icon-button"
            type="button"
            ref={settingsButtonRef}
            aria-label="Open settings"
            aria-expanded={isSettingsOpen}
            onClick={() => setIsSettingsOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 7h10" />
              <path d="M18 7h2" />
              <path d="M4 17h2" />
              <path d="M10 17h10" />
              <path d="M14 5v4" />
              <path d="M8 15v4" />
            </svg>
          </button>
        </nav>
      </header>

      <button
        className={`settings-backdrop ${isSettingsOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close settings"
        onClick={closeSettings}
      />

      <aside
        ref={settingsDrawerRef}
        className={`settings-drawer ${isSettingsOpen ? 'is-open' : ''}`}
        aria-label="Application settings"
        inert={!isSettingsOpen}
      >
        <div className="drawer-header">
          <div>
            <p>Settings</p>
            <h2>Preferences</h2>
          </div>
          <button
            className="close-button"
            type="button"
            aria-label="Close settings"
            onClick={closeSettings}
          >
            X
          </button>
        </div>

        <div className="setting-row">
          <div>
            <span>Theme</span>
            <p>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
          </div>
          <button
            className={`toggle ${theme === 'light' ? 'is-active' : ''}`}
            type="button"
            aria-label="Toggle dark and light mode"
            aria-pressed={theme === 'light'}
            onClick={onThemeToggle}
          >
            <span />
          </button>
        </div>

        <div className="setting-stack">
          <div className="setting-heading">
            <div>
              <span>Sound</span>
              <p>Application volume</p>
            </div>
            <strong>{volume}%</strong>
          </div>
          <input
            aria-label="Application sound volume"
            max="100"
            min="0"
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            type="range"
            value={volume}
          />
        </div>

        <div className="setting-row">
          <div>
            <span>Effects sounds</span>
            <p>{effectsMuted ? 'Mute effects sounds' : 'Enable Sounds'}</p>
          </div>
          <button
            className={`sound-effect-toggle ${effectsMuted ? 'is-muted' : ''}`}
            type="button"
            aria-label={effectsMuted ? 'Enable effects sounds' : 'Mute effects sounds'}
            aria-pressed={!effectsMuted}
            onClick={onToggleEffectsMuted}
          >
            <i
              className={`pi ${effectsMuted ? 'pi-volume-off' : 'pi-volume-up'}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>
    </>
  )
}
