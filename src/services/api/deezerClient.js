import axios from 'axios'

export const deezerClient = axios.create({
  baseURL:
    import.meta.env.VITE_DEEZER_API_URL ??
    'https://deezerdevs-deezer.p.rapidapi.com',
  headers: {
    'Content-Type': 'application/json',
    'x-rapidapi-host':
      import.meta.env.VITE_DEEZER_API_HOST ?? 'deezerdevs-deezer.p.rapidapi.com',
    'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY,
  },
})

const normalizeSearchText = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const getArtistMatchScore = (artistName, query) => {
  const normalizedArtistName = normalizeSearchText(artistName)
  const normalizedQuery = normalizeSearchText(query)
  const artistWords = normalizedArtistName.split(/\s+/)

  if (normalizedArtistName === normalizedQuery) return 100
  if (normalizedArtistName.startsWith(normalizedQuery)) return 90
  if (artistWords.some((word) => word.startsWith(normalizedQuery))) return 80
  if (normalizedArtistName.includes(normalizedQuery)) return 70

  return 0
}

export async function searchArtists(query, signal) {
  const response = await deezerClient.get('/search', {
    params: { q: query },
    signal,
  })

  const artistsById = response.data.data.reduce((artists, track, index) => {
    if (!track.artist) return artists

    const currentArtist = track.artist
    const currentArtistData = artists.get(currentArtist.id)
    const rank = track.rank ?? 0
    const matchScore = getArtistMatchScore(currentArtist.name, query)

    if (!currentArtistData) {
      artists.set(currentArtist.id, {
        ...currentArtist,
        firstResultIndex: index,
        matchScore,
        rank,
      })

      return artists
    }

    artists.set(currentArtist.id, {
      ...currentArtistData,
      matchScore: Math.max(currentArtistData.matchScore, matchScore),
      rank: Math.max(currentArtistData.rank, rank),
    })

    return artists
  }, new Map())

  const artists = Array.from(artistsById.values()).sort((firstArtist, secondArtist) => {
    if (secondArtist.matchScore !== firstArtist.matchScore) {
      return secondArtist.matchScore - firstArtist.matchScore
    }

    if (secondArtist.rank !== firstArtist.rank) {
      return secondArtist.rank - firstArtist.rank
    }

    return firstArtist.firstResultIndex - secondArtist.firstResultIndex
  })

  return artists.slice(0, 5)
}
