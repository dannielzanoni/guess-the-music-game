import axios from 'axios'

export const deezerClient = axios.create({
  baseURL: import.meta.env.VITE_DEEZER_API_URL ?? 'https://api.deezer.com',
})
