import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import fetch from 'node-fetch'
import gtts from 'node-gtts'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import authRoutes from './routes/auth.js'
import historyRoutes from './routes/history.js'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ======== GEMINI AI SETUP =========
const geminiApiKey = process.env.GEMINI_API_KEY || ''
const genAI = geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(geminiApiKey)
  : null
// Default to gemini-flash-latest because free-tier rate limits often enable "Flash" but not older model IDs.
const geminiModelName = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const geminiModel = genAI ? genAI.getGenerativeModel({ model: geminiModelName }) : null

const LANG_NAMES = { hi: 'Hindi', ta: 'Tamil', bn: 'Bengali', gu: 'Gujarati', te: 'Telugu' }

const parseRetryAfterSeconds = (message) => {
  const msg = String(message || '')
  const m1 = msg.match(/Please retry in\s+([0-9]+(?:\.[0-9]+)?)s/i)
  if (m1) return Math.max(1, Math.ceil(Number(m1[1]) || 0))
  const m2 = msg.match(/retryDelay"\s*:\s*"(\d+)s"/i)
  if (m2) return Math.max(1, Number(m2[1]) || 0)
  return null
}

const isGeminiQuotaError = (message) => {
  const msg = String(message || '').toLowerCase()
  return msg.includes('429') || msg.includes('quota exceeded') || msg.includes('too many requests')
}

const sanitizePlainText = (input) => {
  let text = String(input || '').replace(/\r\n?/g, '\n')

  // Remove fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove common markdown formatting
  text = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]*)`/g, '$1')

  // Remove leading list markers like "* ", "- ", "• ", "1. "
  text = text
    .split('\n')
    .map(line => line.replace(/^\s*(?:[\-*•]+\s+|\d+\)\s+|\d+\.\s+)/, ''))
    .join('\n')

  // Drop leftover standalone asterisks that confuse TTS
  text = text.replace(/\*/g, '')

  // Tidy whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

const uploadDir = path.join(process.cwd(), 'uploads')
try { fs.mkdirSync(uploadDir, { recursive: true }) } catch {}
const upload = multer({ dest: uploadDir })

// ======== FILE UPLOAD / OCR / PDF READER =========
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const filePath = path.resolve(req.file.path)
    const ext = path.extname(req.file.originalname || '').toLowerCase()

    if (ext === '.txt') {
      const content = fs.readFileSync(filePath, 'utf8')
      try { fs.unlinkSync(filePath) } catch {}
      return res.json({ text: content })
    }

    const serverCwd = process.cwd()
    const runPy = (script, args) => new Promise((resolve, reject) => {
      execFile('python', [script, ...args], { cwd: serverCwd }, (err, stdout, stderr) => {
        if (!err) return resolve(String(stdout || '').trim())
        execFile('python3', [script, ...args], { cwd: serverCwd }, (err3, stdout3, stderr3) => {
          if (!err3) return resolve(String(stdout3 || '').trim())
          execFile('py', ['-3', script, ...args], { cwd: serverCwd }, (err2, stdout2, stderr2) => {
            if (!err2) return resolve(String(stdout2 || '').trim())
            return reject(stderr2 || stderr3 || stderr || err2?.message || err3?.message || err?.message)
          })
        })
      })
    })

    const doWork = async () => {
      try {
        let out = ''
        if (ext === '.pdf') {
          out = await runPy('pdf_reader.py', [filePath])
        } else {
          out = await runPy('ocr.py', [filePath])
        }
        return res.json({ text: out })
      } catch (e) {
        return res.status(500).json({ error: 'Extraction failed', detail: String(e) })
      } finally {
        try { fs.unlinkSync(filePath) } catch {}
      }
    }
    doWork()
  } catch (e) {
    res.status(500).json({ error: 'Upload handling failed', detail: e.message })
  }
})

// ======== TEXT SUMMARIZATION (Gemini AI) =========
app.post('/summarize', async (req, res) => {
  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  // Fallback: simple sentence extraction if no Gemini key
  const simpleFallback = () => {
    const parts = String(text).trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    return parts.slice(0, Math.max(1, Math.min(3, parts.length))).join(' ') || text;
  };

  if (!geminiModel) {
    return res.json({ summary: simpleFallback(), ai: false });
  }

  try {
    const targetLang = LANG_NAMES[lang] || 'English';
    const prompt = [
      `You are an expert summarizer. Summarize the following text clearly and concisely in ${targetLang}.`,
      `Produce a 4–6 sentence summary that captures all key points.`,
      `Return ONLY plain text (no markdown, no bullet points, no asterisks).`,
      ``,
      `Text:`,
      text
    ].join('\n');

    const result = await geminiModel.generateContent(prompt);
    const summary = sanitizePlainText(result.response.text());
    return res.json({ summary, ai: true });
  } catch (e) {
    const detail = e?.message || String(e)
    console.error('Gemini summarization failed:', detail);

    if (isGeminiQuotaError(detail)) {
      const retryAfter = parseRetryAfterSeconds(detail)
      return res.json({
        summary: simpleFallback(),
        ai: false,
        warning: 'AI quota exceeded (Gemini). Showing basic fallback summary.',
        hint: 'Enable billing / increase quota for your Gemini API key, or use a different key.',
        retryAfterSeconds: retryAfter || undefined,
      })
    }

    return res.json({
      summary: simpleFallback(),
      ai: false,
      warning: 'AI unavailable, used fallback',
      detail,
    });
  }
});

// ======== AI DOCUMENT Q&A (Gemini) =========
app.post('/ask', async (req, res) => {
  const { document, question, lang } = req.body;
  if (!document || !question) {
    return res.status(400).json({ error: 'document and question are required' });
  }

  if (!geminiModel) {
    return res.status(503).json({ error: 'AI not configured. Add GEMINI_API_KEY to server/.env' });
  }

  try {
    const targetLang = LANG_NAMES[lang] || 'English';
    const docSnippet = document.slice(0, 12000); // stay within token limits
    const prompt = [
      `You are a helpful AI assistant. Using ONLY the document provided below, answer the question in ${targetLang}.`,
      `The question may be written in any language; interpret it and respond in ${targetLang}.`,
      `Be clear, direct, and informative. If the answer is not found in the document, say so politely in ${targetLang}.`,
      `Return ONLY plain text (no markdown, no bullet points, no asterisks).`,
      ``,
      `--- DOCUMENT START ---`,
      docSnippet,
      `--- DOCUMENT END ---`,
      ``,
      `Question: ${question}`,
      ``,
      `Answer:`
    ].join('\n');

    const result = await geminiModel.generateContent(prompt);
    const answer = sanitizePlainText(result.response.text());
    return res.json({ answer });
  } catch (e) {
    const detail = e?.message || String(e)
    console.error('Gemini Q&A failed:', detail)

    if (isGeminiQuotaError(detail)) {
      const retryAfter = parseRetryAfterSeconds(detail)
      if (retryAfter) res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({
        error: 'AI quota exceeded',
        detail,
        hint: 'Your Gemini API key/project has no remaining free-tier quota (or billing is required). Enable billing or use a different key.',
        retryAfterSeconds: retryAfter || undefined,
      })
    }

    return res.status(503).json({
      error: 'AI unavailable',
      detail,
      hint: 'Check GEMINI_API_KEY, model availability, and billing/quota limits.'
    })
  }
});

// ======== TRANSLATION =========
app.post('/translate', async (req, res) => {
  try {
    const { text, to, mode } = req.body

    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' })
    if (!to || !String(to).trim()) return res.status(400).json({ error: 'to (target language) is required' })

  const glossary = {
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'end',
    'facilitate': 'help',
    'approximately': 'about',
    'assistance': 'help',
    'inquire': 'ask',
    'enrollment': 'join',
    'enrolment': 'join',
    'authentication': 'login',
    'authorization': 'access',
    'preferences': 'settings',
    'profile': 'account',
    'instructor': 'teacher',
    'instructors': 'teachers',
    'lectures': 'lessons',
    'modules': 'units',
    'assignments': 'homework',
    'quizzes': 'tests',
    'assessments': 'tests',
    'discussion forums': 'discussion boards',
    'direct messaging': 'chat',
    'messaging': 'chat',
    'recommendations': 'suggestions',
    'learning paths': 'learning plans',
    'analytics': 'stats',
    'moderation': 'review',
    'approval workflows': 'approval steps',
    'quality control': 'quality checks',
    'inappropriate': 'not allowed',
    'flagged': 'reported',
    'dashboard': 'home',
    'permissions': 'access',
    'wishlist': 'saved list',
    'bookmarking': 'saving',
    'progress tracking': 'track progress',
    'certifications': 'certificates',
    'certification': 'certificate',
    'achievements': 'badges',
    'engagement': 'activity',
    'platform': 'site',
    'subsequently': 'next',
    'furthermore': 'also',
    'therefore': 'so',
    'prior to': 'before',
    'in order to': 'to',
    'with regard to': 'about',
    'due to the fact that': 'because',
  }

  const simplify = (s) => {
    if (!s) return s
    let t = s.replace(/\r\n?/g, '\n').replace(/[\t ]+/g, ' ').replace(/[ \u00A0]+\n/g, '\n').trim()
    const keys = Object.keys(glossary).sort((a,b)=>b.length-a.length)
    keys.forEach(k => {
      const re = new RegExp(`\\b${k.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'gi')
      t = t.replace(re, (m)=>{
        const rep = glossary[k]
        return m[0] === m[0].toUpperCase() ? rep.charAt(0).toUpperCase()+rep.slice(1) : rep
      })
    })

    t = t.replace(/\s*\d+\)\s+/g, '\n- ').replace(/\s*\d+\.\s+/g, '\n- ').replace(/\s*[•·]\s+/g, '\n- ')
    t = t.replace(/\s-\s/g, ' - ')

    const out = []
    t.split(/\n+/).forEach(line => {
      if (!line.trim()) return
      const chunks = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      chunks.forEach(ch => {
        if (ch.split(' ').length > 24) {
          ch.split(/,\s*/).forEach((part, i) => out.push((i?'- ':'' ) + part.trim()))
        } else {
          out.push(ch.trim())
        }
      })
    })
    return out.join('\n')
  }
  
    const source = mode === 'friendly' ? simplify(String(text)) : String(text)

    // Google translate unofficial endpoint uses GET; long documents can exceed URL limits.
    // Chunk the text to avoid 414/HTML responses.
    const MAX_CHARS = 1500
    const chunkText = (input, maxChars) => {
      const normalized = String(input).replace(/\r\n?/g, '\n')
      const lines = normalized.split('\n')
      const chunks = []
      let buf = ''
      for (const line of lines) {
        const part = (buf ? '\n' : '') + line
        if ((buf + part).length > maxChars) {
          if (buf) chunks.push(buf)
          // If a single line is too long, hard-split it.
          if (line.length > maxChars) {
            for (let i = 0; i < line.length; i += maxChars) chunks.push(line.slice(i, i + maxChars))
            buf = ''
          } else {
            buf = line
          }
        } else {
          buf += part
        }
      }
      if (buf) chunks.push(buf)
      return chunks.length ? chunks : ['']
    }

    const translateBaseUrl = process.env.TRANSLATE_API_URL || 'https://translate.googleapis.com/translate_a/single'
    const chunks = chunkText(source, MAX_CHARS)

    const translateOne = async (chunk) => {
      const url = `${translateBaseUrl}?client=gtx&sl=auto&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(chunk)}`
      const resp = await fetch(url)
      const raw = await resp.text()
      if (!resp.ok) {
        throw new Error(`Translate API failed (${resp.status}). Response: ${raw.slice(0, 200)}`)
      }
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(`Translate API returned non-JSON. First bytes: ${raw.slice(0, 60)}`)
      }
      return (data?.[0] || []).map(p => p?.[0] || '').join('')
    }

    let translated = ''
    for (const c of chunks) {
      // Sequential to avoid rate limits
      translated += await translateOne(c)
    }

    res.json({ translated })
  } catch (e) {
    console.error('Translation failed:', e)
    res.status(500).json({ error: 'Translation failed', detail: e?.message || String(e) })
  }
})

// ======== GLOSSARY (word-level tooltip support) =========
const glossCache = new Map()
app.post('/glossary', async (req, res) => {
  try {
    const { tokens = [], lang } = req.body || {}
    if (!Array.isArray(tokens) || !lang) return res.status(400).json({ error: 'tokens and lang required' })
    const unique = Array.from(new Set(tokens.filter(t => typeof t === 'string' && t.trim()).slice(0, 300)))
    const out = {}
    await Promise.all(unique.map(async (t) => {
      const key = `${lang}:${t}`
      if (glossCache.has(key)) { out[t] = glossCache.get(key); return }
      try {
        const translateBaseUrl = process.env.TRANSLATE_API_URL || 'https://translate.googleapis.com/translate_a/single'
        const url = `${translateBaseUrl}?client=gtx&sl=${encodeURIComponent(lang)}&tl=en&dt=t&q=${encodeURIComponent(t)}`
        const data = await fetch(url).then(r => r.json())
        const eng = data?.[0]?.[0]?.[0] || ''
        if (eng) {
          glossCache.set(key, eng)
          out[t] = eng
        }
      } catch (e) {}
    }))
    res.json({ map: out, count: Object.keys(out).length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Translate a list of tokens (words) to English for tooltips
app.post('/translateTokens', async (req, res) => {
  try {
    const { tokens = [], from = 'auto', to = 'en' } = req.body || {}
    if (!Array.isArray(tokens) || tokens.length === 0) return res.json({ map: {} })
    // Limit to avoid very long URLs / API issues
    const uniq = Array.from(new Set(tokens.filter(t => typeof t === 'string' && t.trim()))).slice(0, 300)
    const translateBaseUrl = process.env.TRANSLATE_API_URL || 'https://translate.googleapis.com/translate_a/single'
    const base = `${translateBaseUrl}?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t`
    const joined = uniq.join('\n')
    const url = `${base}&q=${encodeURIComponent(joined)}`
    let data;
    try {
      data = await fetch(url).then(r => r.json())
    } catch (e) {
      data = null
    }
    let map = {}
    if (data && data[0]) {
      const combined = data[0].map(p => p[0]).join('')
      const parts = combined.split('\n')
      if (parts.length === uniq.length) {
        uniq.forEach((tok, i) => { map[tok] = parts[i] })
      }
    }
    // If bulk call failed or mismatch, fallback per-token in parallel
    if (Object.keys(map).length !== uniq.length) {
      map = {}
      await Promise.all(uniq.map(async (tok) => {
        const u = `${base}&q=${encodeURIComponent(tok)}`
        try {
          const r = await fetch(u).then(r => r.json())
          const gloss = (r && r[0]) ? r[0].map(p => p[0]).join('') : tok
          map[tok] = gloss || tok
        } catch {
          map[tok] = tok
        }
      }))
    }
    res.json({ map })
  } catch (e) {
    console.error('translateTokens error', e)
    res.status(500).json({ error: 'translateTokens failed' })
  }
})

// ======== TTS with gTTS =========
app.post('/tts', (req, res) => {
  const { text, lang } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const tts = gtts(lang || 'ta');
    const outPath = path.join(process.cwd(), 'uploads', `tts-${randomUUID()}.mp3`);

    tts.save(outPath, text, () => {
      res.sendFile(outPath, (err) => {
        if (err) {
          console.error('Send file error:', err);
        }
        fs.unlink(outPath, () => {});
      });
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

// ======== START SERVER =========
// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-translator';

// Helpful startup checks
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. The server will use a weak default secret.\n' +
    'Set JWT_SECRET in your environment or create a .env file based on .env.example to secure tokens.');
}
if (!process.env.MONGO_URI) {
  console.warn('Note: MONGO_URI is not set. Falling back to default local MongoDB URI.');
}

mongoose
  .connect(MONGO_URI, { dbName: process.env.MONGO_DB || undefined })
  .then(() => console.log('MongoDB connected'))
  .catch((e) => console.warn('MongoDB connection failed:', e.message));

// Mount API routes
app.use('/api/auth', authRoutes)
app.use('/api/history', historyRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));