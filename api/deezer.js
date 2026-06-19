const DEFAULT_DEEZER_API_HOST = 'deezerdevs-deezer.p.rapidapi.com'
const DEFAULT_DEEZER_API_URL = `https://${DEFAULT_DEEZER_API_HOST}`

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const queryValue = Array.isArray(request.query?.q)
    ? request.query.q[0]
    : request.query?.q
  const query = queryValue?.trim()

  if (!query) {
    return response.status(400).json({ error: 'Missing search query' })
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY

  if (!rapidApiKey) {
    return response.status(500).json({ error: 'RapidAPI key is not configured' })
  }

  const apiUrl = process.env.DEEZER_API_URL ?? DEFAULT_DEEZER_API_URL
  const apiHost = process.env.DEEZER_API_HOST ?? DEFAULT_DEEZER_API_HOST
  const searchUrl = new URL('/search', apiUrl)
  searchUrl.searchParams.set('q', query)

  try {
    const deezerResponse = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': rapidApiKey,
      },
    })

    const responseBody = await deezerResponse.json()

    if (!deezerResponse.ok) {
      return response.status(deezerResponse.status).json({
        error: 'Could not load songs from Deezer',
      })
    }

    return response.status(200).json(responseBody)
  } catch {
    return response.status(502).json({ error: 'Could not reach Deezer API' })
  }
}
