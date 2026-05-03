import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>SecureNet AI</div>
          <div className="nav-links">
            <button 
              className="nav-link-btn"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </button>
            <button 
              className="get-started-btn"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span className="detect">Detect Cyber Attacks</span>
              <br />
              <span className="before-strike">Before They Strike</span>
            </h1>
            <p className="hero-description">
              Advanced CNN-LSTM deep learning models for real-time network intrusion detection 
              with 97.4% accuracy across 15 attack types
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/signup')}
              >
                Start Monitoring
              </button>
              <button className="btn-secondary" onClick={() => document.getElementById('capabilities').scrollIntoView({ behavior: 'smooth' })}>Learn More</button>
            </div>
          </div>
          
          <div className="hero-stats">
            {/* <div className="timer">00:04</div> */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">15</div>
                <div className="stat-label">Attack Types</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">97.4%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">CNN-LSTM</div>
                <div className="stat-label">Deep Learning</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">Real-time</div>
                <div className="stat-label">Detection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Attack Detection Capabilities */}
      <section className="capabilities" id="capabilities">
        <h2>Attack Detection Capabilities</h2>
        <p className="section-subtitle">Comprehensive threat identification across multiple attack vectors</p>
        
        <div className="capabilities-grid">
          <div className="capability-card">
            <h3>DoS/DDoS</h3>
            <p>Detect distributed denial of service attacks targeting network infrastructure</p>
            <span className="priority high">High Priority</span>
          </div>
          
          <div className="capability-card">
            <h3>Port Scanning</h3>
            <p>Identify reconnaissance attempts and network enumeration activities</p>
            <span className="priority medium">Medium Priority</span>
          </div>
          
          <div className="capability-card">
            <h3>Brute Force</h3>
            <p>Monitor SSH, FTP, and web login brute force attack attempts</p>
            <span className="priority high">High Priority</span>
          </div>
          
          <div className="capability-card">
            <h3>Web Attacks</h3>
            <p>Detect SQL injection, XSS, and other web application exploits</p>
            <span className="priority critical">Critical Priority</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <p className="section-subtitle">Advanced AI pipeline for real-time network threat detection</p>
        
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Traffic Monitoring</h3>
            <p>Continuous analysis of network packets and patterns using real-time data streams.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>CNN-LSTM Analysis</h3>
            <p>Deep learning models extract spatial and temporal features for attack classification.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Instant Alerts</h3>
            <p>Automated email notifications and dashboard alerts for immediate threat response.</p>
          </div>
        </div>
      </section>

      {/* Advanced Security Features */}
      <section className="features">
        <h2>Advanced Security Features</h2>
        <p className="section-subtitle">Comprehensive protection with intelligent threat response</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-time Processing</h3>
            <p>Sub-second threat detection with live network traffic analysis</p>
          </div>
          
          <div className="feature-card">
            <h3>Email Alerts</h3>
            <p>Instant notifications for high-confidence threat detections via SMTP</p>
          </div>
          
          <div className="feature-card">
            <h3>Live Dashboard</h3>
            <p>Interactive monitoring interface with real-time attack visualization</p>
          </div>
          
          <div className="feature-card">
            <h3>Configurable Thresholds</h3>
            <p>Adjustable sensitivity settings for customized security posture</p>
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="status-cards">
          <div className="status-card">
            <div className="status-header">
              <h4>DoS Attack</h4>
              <span className="status-badge high">High</span>
            </div>
            <p className="last-detected">Last detected: 2 min ago</p>
            <div className="progress-bar">
              <div className="progress" style={{width: '89%'}}>89%</div>
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-header">
              <h4>Port Scan</h4>
              <span className="status-badge medium">Medium</span>
            </div>
            <p className="last-detected">Last detected: 5 min ago</p>
            <div className="progress-bar">
              <div className="progress" style={{width: '76%'}}>76%</div>
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-header">
              <h4>System Status</h4>
              <span className="status-badge normal">Normal</span>
            </div>
            <p className="last-detected">Monitoring active</p>
            <div className="progress-bar">
              <div className="progress" style={{width: '97%'}}>97%</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Secure Your Network Today</h2>
        <p>Deploy advanced AI-powered intrusion detection in minutes</p>
        <button 
          className="btn-primary"
          onClick={() => navigate('/signin')}
        >
          Start Monitoring →
        </button>
      </section>
    </div>
  );
}

export default Home;