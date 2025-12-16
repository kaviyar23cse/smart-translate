import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Languages, Volume2, Upload, Zap, Users, Download, HelpCircle, Globe, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  const [tickerText, setTickerText] = useState(0);
  const tickerWords = ['Translate', 'Summarize', 'Listen'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerText((prev) => (prev + 1) % tickerWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Languages,
      title: "Multi-language Support",
      description: "Translate in Hindi, Tamil, Bengali, and more with high accuracy.",
      color: "from-blue-500 to-cyan-500",
      bgAccent: "rgba(59, 130, 246, 0.1)"
    },
    {
      icon: FileText,
      title: "Text & Document Extraction",
      description: "Upload PDFs, images, or paste text for instant processing.",
      color: "from-purple-500 to-pink-500",
      bgAccent: "rgba(147, 51, 234, 0.1)"
    },
    {
      icon: Zap,
      title: "Intelligent Summarization",
      description: "Condense lengthy content into concise, meaningful summaries.",
      color: "from-orange-500 to-yellow-500",
      bgAccent: "rgba(249, 115, 22, 0.1)"
    },
    {
      icon: Volume2,
      title: "Text-to-Speech",
      description: "Listen to translations in natural, clear voices.",
      color: "from-green-500 to-emerald-500",
      bgAccent: "rgba(34, 197, 94, 0.1)"
    },
    {
      icon: Download,
      title: "Export & Download",
      description: "Save your translations as text files, audio, or Word documents.",
      color: "from-red-500 to-rose-500",
      bgAccent: "rgba(239, 68, 68, 0.1)"
    },
    {
      icon: HelpCircle,
      title: "Word Tooltips",
      description: "Hover over words for instant definitions and pronunciation guides.",
      color: "from-indigo-500 to-purple-500",
      bgAccent: "rgba(99, 102, 241, 0.1)"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Upload or Type",
      description: "Add text, document, or image.",
      icon: Upload
    },
    {
      step: "02",
      title: "Translate & Summarize",
      description: "Process instantly with one click.",
      icon: Zap
    },
    {
      step: "03",
      title: "Listen & Share",
      description: "Hear the output or share it with others.",
      icon: Volume2
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background gradients */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        right: '-20%',
        width: '80%',
        height: '80%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />



      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .hero-content { padding: 40px 20px !important; }
          .hero-title { font-size: 36px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-container { flex-direction: column !important; }
          .step-item { max-width: 100% !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '100px 24px 80px', 
        textAlign: 'center' 
      }} className="hero-content">
        <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '30px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#818cf8',
            letterSpacing: '0.05em'
          }}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: '8px' }} />
            AI-POWERED TRANSLATION
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            margin: '0 0 24px 0',
            lineHeight: '1.15',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            color: '#ffffff',
            textShadow: '0 2px 20px rgba(99, 102, 241, 0.2)'
          }} className="hero-title">
            Break Language Barriers with <span style={{
              color: '#6366f1',
              fontWeight: '900'
            }}>Smart Translator</span>
          </h1>
          
          <p style={{
            color: '#94a3b8',
            maxWidth: '680px',
            margin: '0 auto 40px auto',
            lineHeight: '1.8',
            fontSize: 'clamp(16px, 2vw, 20px)'
          }}>
            Translate, summarize, and listen to content in multiple Indian languages with advanced AI. Experience seamless communication at your fingertips.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px'
          }}>
            <Link 
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }}>
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            
            <Link 
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}>
              Sign In
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: '32px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            alignItems: 'center',
            color: '#64748b',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              No credit card required
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              Instant access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '30px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#818cf8',
            letterSpacing: '0.05em'
          }}>
            FEATURES
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '16px',
            letterSpacing: '-0.01em'
          }}>
            Everything You Need in One Platform
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '640px', margin: '0 auto' }}>
            Powerful features designed to simplify your translation and communication needs.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }} className="features-grid">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '32px',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${feature.color})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <IconComponent size={28} color="white" />
                </div>
                
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '12px'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '15px'
                }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '16px',
            letterSpacing: '-0.01em'
          }}>
            How It Works
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '640px', margin: '0 auto' }}>
            Get started in three simple steps
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }} className="steps-container">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                style={{
                  flex: '1',
                  minWidth: '280px',
                  maxWidth: '360px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center'
                }}
                className="step-item"
              >
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#fff'
                }}>
                  {step.step}
                </div>
                
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '12px'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '15px'
                }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final CTA Section */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px 120px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '24px',
          padding: 'clamp(40px, 8vw, 80px) clamp(24px, 5vw, 60px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '20px',
            letterSpacing: '-0.01em'
          }}>
            Ready to Get Started?
          </h2>
          
          <p style={{
            color: '#94a3b8',
            fontSize: 'clamp(16px, 2vw, 20px)',
            marginBottom: '40px',
            maxWidth: '640px',
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            Join thousands of users breaking language barriers with Smart Translator. Start your free trial today.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }}>
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
          </div>
          
          <div style={{
            marginTop: '32px',
            color: '#64748b',
            fontSize: '14px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              Free forever
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              No credit card
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px 24px',
        textAlign: 'center',
        color: '#64748b',
        position: 'relative',
        zIndex: 1
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          © 2025 Smart Translator. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
