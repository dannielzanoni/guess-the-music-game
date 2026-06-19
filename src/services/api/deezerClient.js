import axios from 'axios'

export const deezerClient = axios.create({
  baseURL: '/api/deezer',
})

export const normalizeSearchText = (value) =>
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
  const response = await deezerClient.get('', {
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

export async function getArtistTopTracks(artist, signal) {
  const response = await deezerClient.get('', {
    params: { q: artist.name },
    signal,
  })

  const normalizedArtistName = normalizeSearchText(artist.name)
  const tracksById = response.data.data.reduce((tracks, track) => {
    const isSelectedArtistTrack =
      track.artist?.id === artist.id ||
      normalizeSearchText(track.artist?.name ?? '') === normalizedArtistName

    if (!isSelectedArtistTrack || tracks.has(track.id)) return tracks

    tracks.set(track.id, track)

    return tracks
  }, new Map())

  return Array.from(tracksById.values())
    .sort((firstTrack, secondTrack) => (secondTrack.rank ?? 0) - (firstTrack.rank ?? 0))
    .slice(0, 25)
}
