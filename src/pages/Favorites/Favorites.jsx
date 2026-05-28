import './Favorites.css'

export function Favorites({
  favoriteArtists,
  onSelectFavoriteArtist,
  onToggleFavoriteArtist,
}) {
  return (
    <main className="favorites-page">
      <section className="favorites-panel" aria-labelledby="favorites-title">
        <div>
          <h1 id="favorites-title">Favorite Artists</h1>
          <p>Pick an artist to start a new search from the home page.</p>
        </div>

        {favoriteArtists.length > 0 ? (
          <div className="favorites-grid">
            {favoriteArtists.map((artist) => (
              <article className="favorite-card" key={artist.id}>
                <button
                  className="favorite-card-main"
                  type="button"
                  onClick={() => onSelectFavoriteArtist(artist)}
                >
                  <img
                    src={artist.picture_medium || artist.picture_small}
                    alt={artist.name}
                  />
                  <span>{artist.name}</span>
                </button>

                <button
                  className="favorite-remove"
                  type="button"
                  aria-label={`Remove ${artist.name} from favorites`}
                  onClick={() => onToggleFavoriteArtist(artist)}
                >
                  <i className="pi pi-star-fill" aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="favorites-empty">No favorite artists yet</div>
        )}
      </section>
    </main>
  )
}
