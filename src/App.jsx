import { useState } from 'react'
import { Header } from './components/Header/Header'
import { Home } from './pages/Home/Home'
import './App.css'

function App() {
  const [theme, setTheme] = useState('dark')
  const [volume, setVolume] = useState(70)

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-root" data-theme={theme}>
      <Header
        theme={theme}
        volume={volume}
        onThemeToggle={toggleTheme}
        onVolumeChange={setVolume}
      />
      <Home />
    </div>
  )
}

export default App
