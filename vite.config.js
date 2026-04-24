import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const GEMINI_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY
  const GEMINI_MODEL = env.VITE_GEMINI_MODEL || 'gemini-1.5-pro'

  return defineConfig({
    plugins: [react()],
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          if (!GEMINI_KEY) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Gemini API key is not configured on the server.' }))
            return
          }

          let rawBody = ''
          for await (const chunk of req) rawBody += chunk
          const payload = rawBody ? JSON.parse(rawBody) : {}
          const candidateModels = [GEMINI_MODEL]
          if (GEMINI_MODEL === 'gemini-1.5-pro') candidateModels.push('gemini-1.5', 'gemini-1.0-pro', 'gemini-1.0')
          else if (GEMINI_MODEL === 'gemini-1.5') candidateModels.push('gemini-1.0')
          else if (GEMINI_MODEL === 'gemini-1.0-pro') candidateModels.push('gemini-1.0')

          let apiRes = null
          let apiUrl = ''
          let model = ''
          let lastText = ''

          for (const candidate of candidateModels) {
            model = candidate
            apiUrl = `https://gemini.googleapis.com/v1/models/${encodeURIComponent(model)}:generate?key=${encodeURIComponent(GEMINI_KEY)}`
            apiRes = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
            lastText = await apiRes.text()
            if (apiRes.ok) break
            if (apiRes.status !== 404) break
          }

          if (!apiRes?.ok) {
            console.error('Gemini proxy error', { apiUrl, status: apiRes?.status, body: lastText, model })
            res.statusCode = apiRes?.status || 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Gemini API ${apiRes?.status || 500}`, details: lastText, model, apiUrl }))
            return
          }

          res.statusCode = apiRes.status
          res.setHeader('Content-Type', 'application/json')
          res.end(lastText)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message || 'Gemini proxy error' }))
        }
      })
    },
  })
}
