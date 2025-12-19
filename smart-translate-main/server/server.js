import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import fetch from 'node-fetch'
import gtts from 'node-gtts'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import historyRoutes from './routes/history.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

/* ================== FILE UPLOAD SETUP ================== */
const uploadsPath = path.join(process.cwd(), 'uploads')
try {
  fs.mkdirSync(uploadsPath, { recursive: true })
} catch {}

const uploader = multer({ dest: uploadsPath })

/* ================== FILE UPLOAD / OCR / PDF ================== */
app.post('/upload', uploader.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const uploadedFilePath = path.resolve(req.file.path)
    const fileExt = path.extname(req.file.originalname || '').toLowerCase()

    if (fileExt === '.txt') {
      const data = fs.readFileSync(uploadedFilePath, 'utf8')
      try { fs.unlinkSync(uploadedFilePath) } catch {}
      return res.json({ text: data })
    }

    const baseDir = process.cwd()

    const runPythonScript = (script, args) =>
      new Promise((resolve, reject) => {
        execFile('python', [script, ...args], { cwd: baseDir }, (err, stdout, stderr) => {
          if (!err) return resolve(String(stdout || '').trim())

          execFile('py', ['-3', script, ...args], { cwd: baseDir }, (err2, stdout2, stderr2) => {
            if (!err2) return resolve(String(stdout2 || '').trim())
            reject(stderr2 || stderr || err2?.message || err?.message)
          })
        })
      })

    ;(async () => {
      try {
        let extractedText = ''
        if (fileExt === '.pdf') {
          extractedText = await runPythonScript('pdf_reader.py', [uploadedFilePath])
        } else {
          extractedText = await runPythonScript('ocr.py', [uploadedFilePath])
        }
        res.json({ text: extractedText })
      } catch (err) {
        res.status(500).json({ error: 'Extraction failed', detail: String(err) })
      } finally {
        try { fs.unlinkSync(uploadedFilePath) } catch {}
      }
    })()

  } catch (err) {
    res.status(500).json({ error: 'Upload handling failed', detail: err.message })
  }
})

/* ================== TEXT SUMMARIZATION ================== */
app.post('/summarize', (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'No text provided' })
  }

  try {
    const sentences = String(text)
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)

    const summaryText = sentences
      .slice(0, Math.max(1, Math.min(3, sentences.length)))
      .join(' ')

    res.json({ summary: summaryText || text })
  } catch (err) {
    console.error('Summarization error:', err)
    res.status(500).json({ error: 'Summarization failed', detail: err.message })
  }
})

/* ================== TRANSLATION ================== */
app.post('/translate', async (req, res) => {
  const { text, to, mode } = req.body

  const glossary = {
    utilize: 'use',
    commence: 'start',
    terminate: 'end',
    facilitate: 'help',
    approximately: 'about',
    assistance: 'help',
    inquire: 'ask',
    enrollment: 'join',
    enrolment: 'join',
    authentication: 'login',
    authorization: 'access',
    preferences: 'settings',
    profile: 'account',
    instructor: 'teacher',
    instructors: 'teachers',
    lectures: 'lessons',
    modules: 'units',
    assignments: 'homework',
    quizzes: 'tests',
    assessments: 'tests',
    dashboard: 'home',
    permissions: 'access'
  }

  const simplifyText = (input) => {
    if (!input) return input

    let output = input
      .replace(/\r\n?/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/[ \u00A0]+\n/g, '\n')
      .trim()

    Object.keys(glossary)
      .sort((a, b) => b.length - a.length)
      .forEach((key) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi')
        output = output.replace(regex, glossary[key])
      })

    return output
  }

  const sourceText = mode === 'friendly' ? simplifyText(text) : text
  const baseURL = process.env.TRANSLATE_API_URL || 'https://translate.googleapis.com/translate_a/single'
  const url = `${baseURL}?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(sourceText)}`

  const response = await fetch(url).then(r => r.json())
  res.json({ translated: response[0].map(x => x[0]).join('') })
})

/* ================== GLOSSARY ================== */
const glossaryCache = new Map()

app.post('/glossary', async (req, res) => {
  try {
    const { tokens = [], lang } = req.body
    if (!Array.isArray(tokens) || !lang) {
      return res.status(400).json({ error: 'tokens and lang required' })
    }

    const uniqueTokens = [...new Set(tokens.filter(Boolean))].slice(0, 300)
    const result = {}

    await Promise.all(uniqueTokens.map(async (token) => {
      const cacheKey = `${lang}:${token}`
      if (glossaryCache.has(cacheKey)) {
        result[token] = glossaryCache.get(cacheKey)
        return
      }

      try {
        const apiBase = process.env.TRANSLATE_API_URL || 'https://translate.googleapis.com/translate_a/single'
        const apiUrl = `${apiBase}?client=gtx&sl=${lang}&tl=en&dt=t&q=${encodeURIComponent(token)}`
        const data = await fetch(apiUrl).then(r => r.json())
        const translated = data?.[0]?.[0]?.[0]
        if (translated) {
          glossaryCache.set(cacheKey, translated)
          result[token] = translated
        }
      } catch {}
    }))

    res.json({ map: result, count: Object.keys(result).length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ================== TEXT TO SPEECH ================== */
app.post('/tts', (req, res) => {
  const { text, lang } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' })
  }

  try {
    const speaker = gtts(lang || 'ta')
    const audioPath = path.join(process.cwd(), 'tts.mp3')

    speaker.save(audioPath, text, () => {
      res.sendFile(audioPath, () => {
        fs.unlink(audioPath, () => {})
      })
    })
  } catch (err) {
    res.status(500).json({ error: 'TTS generation failed' })
  }
})

/* ================== SERVER START ================== */
const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-translator'

mongoose
  .connect(DB_URI, { dbName: process.env.MONGO_DB || undefined })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.warn('MongoDB connection failed:', err.message))

app.use('/api/auth', authRoutes)
app.use('/api/history', historyRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
