import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext.jsx';
import API_BASE_URL from '../config.js';
import { useToast } from '../context/ToastContext.jsx';
import './HistoryPage.css';
import '../App.css';

function HistoryPage() {
    const { user } = useContext(AuthContext);
    const token = sessionStorage.getItem('token');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user || !token) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } });
                setHistory(res.data.items || []);
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, token]);

    const handleClearAll = async () => {
        if (!user || !token) return;
        try {
            const res = await axios.delete(`${API_BASE_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } });
            setHistory([]);
            toast.success(`Cleared history (${res.data.deletedCount || 0}).`);
        } catch (e) {
            console.error('Clear all failed', e);
            toast.error('Failed to clear history');
        } finally {
            setConfirmOpen(false);
        }
    };

    return (
        <div className="page">
            <header className="hero" style={{ textAlign: 'center' }}>
                <h1 className="hero-title">My Translation History</h1>
                <p className="hero-tagline">View your past translations and summaries.</p>
                <div style={{ marginTop: '10px' }}>
                    <button className="btn subtle" onClick={() => setConfirmOpen(true)} disabled={history.length === 0}>Clear all history</button>
                </div>
            </header>
            <main className="card" style={{ width: '100%' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading history...</p>
                ) : history.length > 0 ? (
                    history.map(item => (
                        <div key={item._id} className="history-item">
                            <div className="history-pane">
                                <div className="pane-title">Original ({new Date(item.createdAt).toLocaleDateString()})</div>
                                <textarea rows={3} value={item.original} readOnly className="area" />
                            </div>
                            <div className="history-pane">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="pane-title">Translated</div>
                                    <button className="btn subtle" onClick={async ()=>{
                                        if (!confirm('Delete this history item?')) return;
                                        try {
                                            await axios.delete(`${API_BASE_URL}/api/history/${item._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                            setHistory(h => h.filter(it => it._id !== item._id));
                                            toast.info('Item deleted');
                                        } catch (e) {
                                            console.error('Failed to delete item', e);
                                            toast.error('Failed to delete item');
                                        }
                                    }}>Delete</button>
                                </div>
                                <textarea rows={3} value={item.translated} readOnly className="area" />
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No history found.</p>
                )}
            </main>

            {/* Confirmation modal (simple inline) */}
            {confirmOpen && (
                <div className="modal-backdrop">
                    <div className="modal card">
                        <h3>Clear all history?</h3>
                        <p>This will permanently delete all your saved translations. This action cannot be undone (unless you use Undo immediately).</p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="btn subtle" onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button className="btn danger" onClick={handleClearAll}>Yes, clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;
