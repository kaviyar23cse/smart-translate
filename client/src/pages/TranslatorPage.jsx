import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Upload, Globe, Play, Pause, Square, Download, Loader2, Bot, Volume2, Mic, MicOff } from "lucide-react";
import AuthContext from "../context/AuthContext.jsx";
import API_BASE_URL from "../config.js";
import "./TranslatorPage.css";
import { smartNotify, ensureNotifyPermission } from "../utils/notify";

// Loading Overlay Component
const LoadingOverlay = ({ type, isVisible }) => {
    if (!isVisible) return null;

    const loadingConfig = {
        extracting: {
            title: 'Extracting Text',
            subtitle: 'Analyzing your document and extracting content...',
            steps: ['Upload', 'Parse', 'Extract']
        },
        translating: {
            title: 'Translating',
            subtitle: 'Converting your text with AI-powered translation...',
            steps: ['Analyze', 'Translate', 'Format']
        },
        summarizing: {
            title: 'Summarizing',
            subtitle: 'Creating an intelligent summary of your content...',
            steps: ['Process', 'Condense', 'Generate']
        },
        asking: {
            title: 'AI is Thinking',
            subtitle: 'Analysing the document and forming an answer...',
            steps: ['Read', 'Reason', 'Answer']
        },
        speaking: {
            title: 'Generating Audio',
            subtitle: 'Converting text to natural speech...',
            steps: ['Prepare', 'Synthesize', 'Stream']
        }
    };

    const config = loadingConfig[type] || loadingConfig.translating;

    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="loading-spinner-container">
                    <div className="loading-spinner-ring"></div>
                    <div className="loading-spinner-ring"></div>
                    <div className="loading-spinner-ring"></div>
                    <div className="loading-pulse"></div>
                </div>
                <h3 className="loading-title">{config.title}</h3>
                <p className="loading-subtitle">{config.subtitle}</p>
                <div className="loading-progress-track">
                    <div className="loading-progress-bar"></div>
                </div>
                <div className="loading-steps">
                    {config.steps.map((step, i) => (
                        <div key={i} className={`loading-step ${i === 0 ? 'completed' : i === 1 ? 'active' : ''}`} title={step}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

function TranslatorPage() {
    // Get user from context
    const { user, token } = useContext(AuthContext); 

    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [translated, setTranslated] = useState("");
    const [lang, setLang] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingType, setLoadingType] = useState(null); // 'extracting', 'translating', 'summarizing', 'speaking'
    const [speaking, setSpeaking] = useState(false);
    const [audioObj, setAudioObj] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [showTooltips, setShowTooltips] = useState(false);
    const [glossMap, setGlossMap] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [paused, setPaused] = useState(false);
    const [summarizedText, setSummarizedText] = useState("");
    const [summarizedNative, setSummarizedNative] = useState("");
    // Q&A state
    const [question, setQuestion] = useState("");
    const [aiAnswer, setAiAnswer] = useState("");
    const [answerAudioObj, setAnswerAudioObj] = useState(null);
    const [answerSpeaking, setAnswerSpeaking] = useState(false);

    // Mic (Speech-to-Text) for asking questions
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const speechLocaleForLang = (code) => {
        switch (code) {
            case 'hi': return 'hi-IN';
            case 'ta': return 'ta-IN';
            case 'te': return 'te-IN';
            case 'bn': return 'bn-IN';
            case 'gu': return 'gu-IN';
            default: return 'en-US';
        }
    };

    useEffect(() => {
        // Cleanup recognition when navigating away
        return () => {
            try {
                if (recognitionRef.current) recognitionRef.current.stop();
            } catch {}
        };
    }, []);

    const toggleMic = async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Try Chrome on desktop/mobile.');
            return;
        }

        // Stop if already listening
        if (recognitionRef.current && listening) {
            try { recognitionRef.current.stop(); } catch {}
            setListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = speechLocaleForLang(lang);
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = (e) => {
            setListening(false);
            // Common case: user blocked mic permission
            console.error('Speech recognition error', e);
            if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
                alert('Microphone permission denied. Allow mic access and try again.');
            }
        };

        recognition.onresult = (event) => {
            const transcript = event?.results?.[0]?.[0]?.transcript || '';
            if (transcript.trim()) {
                setQuestion((prev) => (prev && !prev.endsWith(' ') ? prev + ' ' : prev) + transcript.trim());
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Speech recognition start failed', e);
            setListening(false);
        }
    };

    useEffect(() => {
    // Ask for notification permission early so we can notify when jobs finish
    ensureNotifyPermission().catch(()=>{});
        const buildGloss = async () => {
            if (!showTooltips || !translated) { setGlossMap({}); return; }
            const tokens = Array.from(new Set(translated
                .split(/\s+/)
                .map(t => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
                .filter(t => t && !/^\d+$/.test(t))
            ));
            if (tokens.length === 0) { setGlossMap({}); return; }
            try {
                const res = await axios.post(`${API_BASE_URL}/translateTokens`, { tokens, from: lang, to: 'en' });
                setGlossMap(res.data.map || {});
            } catch (e) {
                console.error('tooltip gloss fetch failed', e);
                setGlossMap({});
            }
        };
        buildGloss();
    }, [showTooltips, translated, lang, token]);

    const renderWithTooltips = (text) => {
        const dict = glossMap || {};
        if (!text) return null;
        const tokens = text.split(/(\s+)/);
        const elements = tokens.map((tok, i) => {
            if (/^\s+$/.test(tok) || tok === '') return tok;
            const core = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
            const tip = dict[core];
            if (tip) {
                return <span key={i} className="tooltip" data-tip={tip}>{tok}</span>;
            }
            return tok;
        });
        return <div className="translated-output">{elements}</div>;
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const form = new FormData();
        form.append("file", file);

        setLoading(true);
        setLoadingType('extracting');
        try {
            const res = await axios.post(`${API_BASE_URL}/upload`, form);
            setText(res.data.text);
            setTranslated("");
            smartNotify('Text extracted', { body: 'Your document text is ready to translate.' }).catch(()=>{});
        } catch (err) {
            console.error("Error extracting text:", err);
            alert("Error extracting text. Please try again.");
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    const handleTranslate = async () => {
        if (!user) { alert('Please login to use translation.'); return; }
        if (!text.trim()) return;
        setLoading(true);
        setLoadingType('translating');

        try {
            // Perform the translation
            const res = await axios.post(`${API_BASE_URL}/translate`, { text, to: lang });
            const out = res.data.translated;
            setTranslated(out);
            smartNotify('Translation ready', { body: 'Click to view the translated text.' }).catch(()=>{});
            // Save to history if logged in
            try {
                if (user && token) {
                    await axios.post(`${API_BASE_URL}/api/history`, { original: text, translated: out, lang }, { headers: { Authorization: `Bearer ${token}` } });
                }
            } catch (e) {
                console.warn('History save failed:', e?.response?.data || e.message);
            }

        } catch (err) {
            console.error("Translation failed:", err);
            alert("Translation failed. Please try again.");
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    const handleSpeak = async () => {
        if (!translated.trim()) return;
        setSpeaking(true);
        setPaused(false);
        setProgress(0);
        setDuration(0);

        try {
            const res = await fetch(`${API_BASE_URL}/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: translated, lang })
            });

            if (!res.ok) {
                throw new Error("TTS request failed");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (audioObj) { audioObj.pause(); }
            if (audioUrl) { URL.revokeObjectURL(audioUrl); }

            const audio = new Audio(url);
            audio.onended = () => {
                setSpeaking(false);
                setPaused(false);
                setProgress(0);
                setDuration(0);
                setAudioObj(null);
                URL.revokeObjectURL(url);
                setAudioUrl(null);
            };

            audio.onerror = () => {
                setSpeaking(false);
                setPaused(false);
                console.error("Error playing audio");
            };

            audio.onloadedmetadata = () => {
                setDuration(isFinite(audio.duration) ? audio.duration : 0);
            };

            audio.ontimeupdate = () => {
                const d = isFinite(audio.duration) ? audio.duration : 0;
                const cur = audio.currentTime || 0;
                if (d > 0) setProgress(Math.min(100, (cur / d) * 100));
                else setProgress(prev => (speaking ? (prev + 2) % 100 : 0));
            };

            setAudioObj(audio);
            setAudioUrl(url);
            await audio.play();
        } catch (err) {
            console.error("TTS error:", err);
            setSpeaking(false);
        }
    };

    const downloadText = () => {
        if (!translated) return;
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, translated], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation_${lang}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const downloadAudio = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `translation_${lang}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handlePause = () => {
        if (audioObj && !audioObj.paused) {
            audioObj.pause();
            setPaused(true);
        }
    };

    const handleResume = async () => {
        if (audioObj && audioObj.paused) {
            try {
                await audioObj.play();
                setPaused(false);
            } catch (e) {
                console.error('Resume failed', e);
            }
        }
    };

    const handleStop = () => {
        if (audioObj) {
            audioObj.pause();
            audioObj.currentTime = 0;
        }
        setSpeaking(false);
        setPaused(false);
        setProgress(0);
        setAudioObj(null);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
    const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

    const LANGUAGES = [
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
        { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
        { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
        { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    ];

    const handleSummarize = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setLoadingType('summarizing');
        try {
            // Send the original English text; Gemini generates the summary in the target language directly
            const nativeRes = await axios.post(`${API_BASE_URL}/summarize`, { text, lang });
            const nativeSummary = nativeRes.data.summary || '';
            setSummarizedNative(nativeSummary);

            if (nativeRes.data && nativeRes.data.ai === false) {
                const warn = nativeRes.data.warning || nativeRes.data.hint || 'AI summary unavailable; showing basic fallback.';
                smartNotify('AI summary unavailable', { body: warn }).catch(()=>{});
            }

            // Get English version too
            if (nativeSummary) {
                const englishRes = await axios.post(`${API_BASE_URL}/summarize`, { text, lang: 'en' });
                setSummarizedText(englishRes.data.summary || '');
            } else {
                setSummarizedText('');
            }
            smartNotify('Summary ready', { body: 'Your AI summary has been generated.' }).catch(()=>{});
        } catch (err) {
            console.error("Summarization failed:", err);
            alert(`Summarization failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    const handleAskAI = async () => {
        if (!question.trim() || !text.trim()) return;
        setLoading(true);
        setLoadingType('asking');
        try {
            const res = await axios.post(`${API_BASE_URL}/ask`, {
                document: text,
                question,
                lang
            });
            setAiAnswer(res.data.answer || '');
        } catch (err) {
            console.error("AI Q&A failed:", err);
            const apiErr = err?.response?.data
            const msg = apiErr?.hint || apiErr?.error || apiErr?.detail || err.message
            alert(msg || 'AI Q&A failed. Check server logs.')
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    const handleSpeakAnswer = async () => {
        if (!aiAnswer.trim()) return;
        setAnswerSpeaking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiAnswer, lang })
            });
            if (!res.ok) throw new Error('TTS failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (answerAudioObj) answerAudioObj.pause();
            const audio = new Audio(url);
            audio.onended = () => { setAnswerSpeaking(false); URL.revokeObjectURL(url); setAnswerAudioObj(null); };
            audio.onerror = () => { setAnswerSpeaking(false); };
            setAnswerAudioObj(audio);
            await audio.play();
        } catch (e) {
            console.error('Answer TTS error:', e);
            setAnswerSpeaking(false);
        }
    };

    const handleStopAnswer = () => {
        if (answerAudioObj) { answerAudioObj.pause(); answerAudioObj.currentTime = 0; }
        setAnswerSpeaking(false);
        setAnswerAudioObj(null);
    };

    return (
        <div className="page">
            <LoadingOverlay type={loadingType} isVisible={loading} />
            <header className="hero">
                <h1 className="hero-title">Smart Translator</h1>
                <p className="hero-tagline">Translate. Understand. Listen.</p>
                <p className="hero-desc">Upload a document or type text, translate into Indian languages, and listen with built-in audio.</p>
            </header>

            <main className="card">
                <section>
                    <h2 className="section-title">1. Add your content</h2>
                    <div
                        className={`dropzone ${dragActive ? 'active' : ''}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="dz-icon" size={22} />
                        <div>
                            {file ? (
                                <>
                                    <strong>{file.name}</strong> selected.
                                    <span className="link" onClick={(e) => { e.stopPropagation(); setFile(null); }}> Change file?</span>
                                </>
                            ) : (
                                <>
                                    <strong>Drag & drop</strong> a PDF/Image/TXT here or <span className="link">browse</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            accept=".txt,.pdf,image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="hidden-file"
                        />
                    </div>
                    <div className="row">
                        <button onClick={handleUpload} disabled={loading || !file} className="btn primary">
                            {loading ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
                            {loading ? 'Extracting...' : 'Extract Text'}
                        </button>
                        <button onClick={() => setText("")} disabled={!text} className="btn subtle">Clear Text</button>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">2. Choose language</h2>
                    <div className="controls">
                        <label className="control">
                            <Globe size={18} />
                            <select value={lang} onChange={(e) => setLang(e.target.value)}>
                                <option value="" disabled>Choose language</option>
                                {LANGUAGES.map((l) => (
                                    <option key={l.code} value={l.code}>{`${l.flag} ${l.name}`}</option>
                                ))}
                            </select>
                        </label>
                        <button onClick={handleTranslate} disabled={!text || !lang || loading || !user} title={!user ? 'Login to translate' : (!lang ? 'Choose a language first' : '')} className="btn accent">
                            {loading ? <Loader2 className="spin" size={18} /> : 'Translate'}
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">3. Edit & review</h2>
                    <div className="panes">
                        <div className="pane">
                            <div className="pane-title">Original</div>
                            <textarea
                                rows={10}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type or paste English text here, or extract above."
                                className="area"
                            />
                        </div>
                        <div className="pane">
                            <div className="pane-title">Translated</div>
                            {showTooltips ? (
                                <div className="area area-div">
                                    {renderWithTooltips(translated)}
                                </div>
                            ) : (
                                <textarea rows={10} value={translated} readOnly placeholder="Translated text will appear here." className="area" />
                            )}
                            <div className="tiny-row">
                                <label className="toggle">
                                    <input type="checkbox" checked={showTooltips} onChange={(e) => setShowTooltips(e.target.checked)} />
                                    <span>Word tips</span>
                                </label>
                                <button className="btn subtle ml-auto" onClick={downloadText} disabled={!translated}>
                                    <Download size={18} /> Download Text
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">4. Summarize</h2>
                    <div className="panes">
                        <div className="pane">
                            <div className="pane-title">English Summary</div>
                            <textarea rows={5} value={summarizedText} readOnly placeholder="AI-generated English summary will appear here." className="area" />
                        </div>
                        <div className="pane">
                            <div className="pane-title">Native Summary</div>
                            <textarea rows={5} value={summarizedNative} readOnly placeholder="AI-generated summary in selected language will appear here." className="area" />
                        </div>
                    </div>
                    <div className="row">
                        <button onClick={handleSummarize} disabled={!text || !lang || loading} className="btn accent" title={!lang ? 'Choose a language first' : ''}>
                            {loading ? <Loader2 className="spin" size={18} /> : <Bot size={18} />}
                            {loading ? 'Summarizing...' : 'AI Summarize'}
                        </button>
                    </div>
                </section>

                <section className="ask-ai-section">
                    <h2 className="section-title">5. Ask AI About the Document</h2>
                    <p className="ask-ai-desc">Ask any question about the uploaded document. The AI will answer in your selected language.</p>
                    <div className="ask-ai-input-row">
                        <textarea
                            rows={2}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is the main topic? Who is this document about?"
                            className="area ask-ai-input"
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                        />
                        <div className="ask-ai-actions">
                            <button onClick={toggleMic} disabled={loading || !lang} className={`btn subtle ask-ai-mic ${listening ? 'active' : ''}`} title={!lang ? 'Choose a language first' : (listening ? 'Stop microphone' : 'Ask using microphone')}>
                                {listening ? <MicOff size={18} /> : <Mic size={18} />}
                                {listening ? 'Stop' : 'Mic'}
                            </button>
                            <button onClick={handleAskAI} disabled={!text || !lang || !question.trim() || loading} className="btn accent ask-ai-btn" title={!lang ? 'Choose a language first' : ''}>
                                {loading && loadingType === 'asking' ? <Loader2 className="spin" size={18} /> : <Bot size={18} />}
                                {loading && loadingType === 'asking' ? 'Thinking...' : 'Ask AI'}
                            </button>
                        </div>
                    </div>
                    {aiAnswer && (
                        <div className="ai-answer-box">
                            <div className="ai-answer-header">
                                <span className="ai-answer-label"><Bot size={16} /> AI Answer</span>
                                <div className="ai-answer-controls">
                                    {!answerSpeaking ? (
                                        <button className="btn subtle icon-btn" onClick={handleSpeakAnswer} title="Listen to answer">
                                            <Volume2 size={18} /> Listen
                                        </button>
                                    ) : (
                                        <button className="btn subtle icon-btn" onClick={handleStopAnswer} title="Stop">
                                            <Square size={18} /> Stop
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="ai-answer-text">{aiAnswer}</p>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="section-title">6. Listen</h2>
                    <div className="audio-player">
                        <div className="audio-controls-row">
                            <button className="btn square-btn play" onClick={handleSpeak} disabled={!translated || !lang || speaking} title={!lang ? 'Choose a language first' : ''}>
                                <Play size={20} />
                            </button>
                            <button className="btn square-btn pause" onClick={handlePause} disabled={!audioObj || paused || !speaking}>
                                <Pause size={20} />
                            </button>
                            <button className="btn square-btn resume" onClick={handleResume} disabled={!audioObj || !paused}>
                                <Play size={20} />
                            </button>
                            <button className="btn square-btn danger" onClick={handleStop} disabled={!audioObj}>
                                <Square size={20} />
                            </button>
                            <button className="btn subtle download-audio-btn" onClick={downloadAudio} disabled={!audioUrl}>
                                <Download size={18} /> Audio
                            </button>
                        </div>
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                            {speaking && (
                                <div className="speaking-note">
                                    {duration ? `Playing ${Math.round((progress / 100) * duration)}s / ${Math.round(duration)}s` : 'Loading...'}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default TranslatorPage;
