# Guess the Music Game

Aplicacao React + Vite para um jogo de adivinhar musicas.

## Stack inicial

- React
- Vite
- Axios
- CSS responsivo

## Como rodar

```bash
npm install
npm run dev
```

O projeto roda por padrao em `http://localhost:5173`.

Para rodar com a API serverless localmente, use o Vercel CLI:

```bash
npx vercel dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Deezer API

O frontend chama o proxy serverless em `/api/deezer`. A chave do RapidAPI fica apenas no ambiente serverless, nunca no bundle do navegador.

Para configurar, crie um `.env.local` a partir de `.env.example` ou adicione as variaveis no painel da Vercel:

```txt
DEEZER_API_URL=https://deezerdevs-deezer.p.rapidapi.com
DEEZER_API_HOST=deezerdevs-deezer.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key_here
```

Nao use `VITE_RAPIDAPI_KEY`: variaveis com prefixo `VITE_` sao publicadas no JavaScript do frontend.
