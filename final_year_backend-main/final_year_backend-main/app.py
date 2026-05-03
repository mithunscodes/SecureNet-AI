import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

from flask_sqlalchemy import SQLAlchemy
from models import db, User, EmailConfig
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import numpy as np
import pandas as pd
import tensorflow as tf
import pickle
import random
import threading
import time
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from collections import deque
import logging
import json

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============DataBase Connectivity=======


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


# ============ Configuration ============
class Config:
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USERNAME = ""  # Update with your email
    SMTP_PASSWORD = ""  # Update with your app password
    ALERT_EMAIL = ""    # Update with receiver email
    
    ALERT_THRESHOLD = 80  # Default threshold %
    MONITORING_INTERVAL = 2
    SEQUENCE_LENGTH = 5

config = Config()

# ============ Attack Type Mapping ============
# Map your model's 15 classes to display-friendly names
ATTACK_TYPE_MAP = {
    'BENIGN': 'BENIGN',
    'Bot': 'Bot',
    'DDoS': 'DDoS',
    'DoS GoldenEye': 'DoS',
    'DoS Hulk': 'DoS',
    'DoS Slowhttptest': 'DoS',
    'DoS slowloris': 'DoS',
    'FTP-Patator': 'BruteForce',
    'Heartbleed': 'WebAttack',
    'Infiltration': 'WebAttack',
    'PortScan': 'PortScan',
    'SSH-Patator': 'BruteForce',
    'Web Attack � Brute Force': 'BruteForce',
    'Web Attack � Sql Injection': 'WebAttack',
    'Web Attack � XSS': 'WebAttack'
}

# Attack categories for display
ATTACK_CATEGORIES = ['BENIGN', 'DoS', 'PortScan', 'DDoS', 'BruteForce', 'WebAttack', 'Bot']

def get_display_name(original_class):
    """Convert original class to display-friendly name"""
    return ATTACK_TYPE_MAP.get(original_class, original_class)

def get_severity(confidence, attack_type):
    """Determine severity based on confidence and attack type"""
    if attack_type == 'BENIGN':
        return 'SAFE'
    if attack_type == 'Bot':
        return 'WARNING'
    
    if confidence >= 0.90:
        return 'CRITICAL'
    elif confidence >= 0.80:
        return 'WARNING'
    elif confidence >= 0.70:
        return 'LOW RISK'
    else:
        return 'MONITOR'

# ============ CNN-LSTM Model Class ============
class CNNLSTMModel:
    def __init__(self, model_path='model/'):
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_columns = None
        self.is_loaded = False
        self.accuracy = 97.41  # From your training output
        self.num_classes = 15
        
        # Feature names (78 features from your dataset)
        # self.feature_names = [
        #     ' Destination Port', ' Flow Duration', ' Total Fwd Packets', ' Total Backward Packets',
        #     'Total Length of Fwd Packets', ' Total Length of Bwd Packets', ' Fwd Packet Length Max',
        #     ' Fwd Packet Length Min', ' Fwd Packet Length Mean', ' Fwd Packet Length Std',
        #     'Bwd Packet Length Max', ' Bwd Packet Length Min', ' Bwd Packet Length Mean',
        #     ' Bwd Packet Length Std', 'Flow Bytes/s', ' Flow Packets/s', ' Flow IAT Mean',
        #     ' Flow IAT Std', ' Flow IAT Max', ' Flow IAT Min', 'Fwd IAT Total', ' Fwd IAT Mean',
        #     ' Fwd IAT Std', ' Fwd IAT Max', ' Fwd IAT Min', 'Bwd IAT Total', ' Bwd IAT Mean',
        #     ' Bwd IAT Std', ' Bwd IAT Max', ' Bwd IAT Min', 'Fwd PSH Flags', ' Bwd PSH Flags',
        #     ' Fwd URG Flags', ' Bwd URG Flags', ' Fwd Header Length', ' Bwd Header Length',
        #     'Fwd Packets/s', ' Bwd Packets/s', ' Min Packet Length', ' Max Packet Length',
        #     ' Packet Length Mean', ' Packet Length Std', ' Packet Length Variance', 'FIN Flag Count',
        #     ' SYN Flag Count', ' RST Flag Count', ' PSH Flag Count', ' ACK Flag Count',
        #     ' URG Flag Count', ' CWE Flag Count', ' ECE Flag Count', ' Down/Up Ratio',
        #     ' Average Packet Size', ' Avg Fwd Segment Size', ' Avg Bwd Segment Size',
        #     ' Fwd Header Length.1', 'Fwd Avg Bytes/Bulk', ' Fwd Avg Packets/Bulk',
        #     ' Fwd Avg Bulk Rate', ' Bwd Avg Bytes/Bulk', ' Bwd Avg Packets/Bulk',
        #     'Bwd Avg Bulk Rate', 'Subflow Fwd Packets', ' Subflow Fwd Bytes',
        #     ' Subflow Bwd Packets', ' Subflow Bwd Bytes', 'Init_Win_bytes_forward',
        #     ' Init_Win_bytes_backward', ' act_data_pkt_fwd', ' min_seg_size_forward',
        #     'Active Mean', ' Active Std', ' Active Max', ' Active Min', 'Idle Mean',
        #     ' Idle Std', ' Idle Max', ' Idle Min'
        # ]

        with open(os.path.join('model', 'feature_columns.pkl'), 'rb') as f:
            self.feature_names = pickle.load(f)
        
        self.load_model()
    
    def load_model(self):
        """Load the trained CNN-LSTM model and preprocessing objects"""
        try:
            # Load Keras model
            model_file = os.path.join('model', 'cnn_lstm_intrusion_model.keras')
            if os.path.exists(model_file):
                self.model = tf.keras.models.load_model(model_file)
                logger.info(f"✅ Model loaded from {model_file}")
            else:
                logger.warning(f"⚠️ Model file not found: {model_file}")
                return False
            
            # Load scaler
            with open(os.path.join('model', 'scaler.pkl'), 'rb') as f:
                self.scaler = pickle.load(f)
            logger.info("✅ Scaler loaded")
            
            # Load label encoder
            with open(os.path.join('model', 'label_encoder.pkl'), 'rb') as f:
                self.label_encoder = pickle.load(f)
            logger.info(f"✅ Label encoder loaded with {len(self.label_encoder.classes_)} classes")
            
            self.is_loaded = True
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            self.is_loaded = False
            return False
    
    def preprocess(self, features):
        """Preprocess features for model prediction"""
        # Create DataFrame with all features
        df = pd.DataFrame([features])
        
        # Ensure all features exist
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = 0
        
        # Select features in correct order
        df = df[self.feature_names]
        
        # Handle missing/infinite values
        df = df.fillna(0)
        df = df.replace([np.inf, -np.inf], 0)
        
        # Scale features
        scaled = self.scaler.transform(df)
        
        # Create sequence (reshape for LSTM)
        # Since we have a single sample, duplicate to create sequence
        seq_length = 5
        sequence = np.array([scaled] * seq_length)
        
        return sequence.reshape(1, seq_length, -1)
    
    def predict(self, features):
        """Make prediction using the trained model"""
        if not self.is_loaded or self.model is None:
            return self.fallback_prediction(features)
        
        try:
            # Preprocess
            processed = self.preprocess(features)
            
            # Predict
            predictions = self.model.predict(processed, verbose=0)
            class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][class_idx])
            predicted_class = self.label_encoder.classes_[class_idx]
            
            return predicted_class, confidence
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self.fallback_prediction(features)
    
    def fallback_prediction(self, features):
        """Intelligent fallback based on network patterns"""
        # Extract key features
        packet_rate = features.get(' Flow Packets/s', features.get('count', 0))
        duration = features.get(' Flow Duration', features.get('duration', 0))
        fwd_packets = features.get(' Total Fwd Packets', features.get('count', 0))
        
        # Simple rule-based detection
        if packet_rate > 1000:
            return 'DoS Hulk', 0.92
        elif duration > 100 and fwd_packets > 500:
            return 'DDoS', 0.88
        elif packet_rate > 500:
            return 'PortScan', 0.85
        elif fwd_packets > 200:
            return 'BruteForce', 0.75
        else:
            return 'BENIGN', 0.95

# ============ Email Alert System ============
class EmailAlertSystem:
    def __init__(self):
        self.enabled = False
        self.last_alert_time = {}
        
    def configure(self, username, password, alert_email):
        self.username = username
        self.password = password
        self.alert_email = alert_email
        self.enabled = bool(username and password)
        
        if self.enabled:
            logger.info("✅ Email alerts configured")
    
    def send_alert(self, attack_type, confidence, source_ip, dest_ip, severity):
        if not self.enabled:
            return
        
        # Rate limit: 1 alert per 30 seconds per attack type
        current_time = time.time()
        if attack_type in self.last_alert_time:
            if current_time - self.last_alert_time[attack_type] < 30:
                return
        self.last_alert_time[attack_type] = current_time
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = self.alert_email
            msg['Subject'] = f"🚨 SECURITY ALERT: {attack_type} Attack Detected!"
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h2 style="color: #ff4444;">🚨 Security Alert: {attack_type} Attack Detected!</h2>
                <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Attack Type:</strong> {attack_type}</p>
                <p><strong>Severity:</strong> {severity}</p>
                <p><strong>Confidence:</strong> {confidence:.1%}</p>
                <p><strong>Source IP:</strong> {source_ip}</p>
                <p><strong>Destination IP:</strong> {dest_ip}</p>
                <hr>
                <p>This is an automated alert from SecureNet AI Intrusion Detection System.</p>
                <p>Model Accuracy: 97.41%</p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            context = ssl.create_default_context()
            with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"📧 Alert sent for {attack_type}")
            
        except Exception as e:
            logger.error(f"Email error: {e}")

# ============ Traffic Monitor ============
class TrafficMonitor:
    def __init__(self):
        self.active = False
        self.mode = 'auto'
        self.stats = {
            'total_detections': 0,
            'active_threats': 0,
            'monitoring_time': 0,
            'attack_distribution': {cat: 0 for cat in ATTACK_CATEGORIES}
        }
        self.current_logs = []
        self.all_logs = []
        self.monitor_thread = None

    def start(self):
        if self.active:
            return
        self.active = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("✅ Monitoring started")

    def stop(self):
        self.active = False
        logger.info("⏹️ Monitoring stopped")

    def _monitor_loop(self):
        start_time = time.time()

        while self.active:
            if self.mode == 'auto':
                traffic = self._generate_traffic()
                if traffic:
                    self._push_traffic(traffic)

            self.stats['monitoring_time'] = int(time.time() - start_time)
            socketio.emit('stats_update', self.stats)
            time.sleep(config.MONITORING_INTERVAL)

    def _push_traffic(self, traffic):
        self.current_logs.insert(0, traffic)
        self.current_logs = self.current_logs[:20]
        self.all_logs.append(traffic)
        self._update_stats(traffic)
        socketio.emit('new_detection', traffic)
        if traffic['attack_type'] != 'BENIGN' and traffic['confidence'] >= config.ALERT_THRESHOLD / 100:
            email_alerts.send_alert(
                traffic['attack_type'],
                traffic['confidence'],
                traffic['source_ip'],
                traffic['dest_ip'],
                traffic['severity']
            )
    
    def _generate_traffic(self):
        """Generate realistic network traffic features"""
        features = self._generate_features()

        # Get prediction from model
        predicted_class, confidence = cnn_lstm.predict(features)

        # If model returns BENIGN, use rule-based fallback 40% of the time
        if predicted_class == 'BENIGN' and random.random() < 0.4:
            fallback_class, fallback_conf = cnn_lstm.fallback_prediction(features)
            if fallback_class != 'BENIGN':
                predicted_class = fallback_class
                confidence = fallback_conf

        display_name = get_display_name(predicted_class)
        severity = get_severity(confidence, display_name)
        
        return {
            'id': random.randint(10000, 99999),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
            'dest_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
            'attack_type': display_name,
            'original_class': predicted_class,
            'confidence': confidence,
            'severity': severity,
            'is_threat': display_name != 'BENIGN'
        }
    
    def _generate_features(self):
        """Generate random network traffic features covering all 78 features"""
        fwd_packets = random.randint(0, 1000)
        bwd_packets = random.randint(0, 500)
        fwd_pkt_len = random.uniform(0, 1500)
        bwd_pkt_len = random.uniform(0, 1500)

        return {
            ' Destination Port': random.choice([80, 443, 22, 21, 8080, random.randint(1024, 65535)]),
            ' Flow Duration': random.uniform(0, 100000000),
            ' Total Fwd Packets': fwd_packets,
            ' Total Backward Packets': bwd_packets,
            'Total Length of Fwd Packets': fwd_packets * fwd_pkt_len,
            ' Total Length of Bwd Packets': bwd_packets * bwd_pkt_len,
            ' Fwd Packet Length Max': fwd_pkt_len * random.uniform(1, 2),
            ' Fwd Packet Length Min': fwd_pkt_len * random.uniform(0, 1),
            ' Fwd Packet Length Mean': fwd_pkt_len,
            ' Fwd Packet Length Std': random.uniform(0, 200),
            'Bwd Packet Length Max': bwd_pkt_len * random.uniform(1, 2),
            ' Bwd Packet Length Min': bwd_pkt_len * random.uniform(0, 1),
            ' Bwd Packet Length Mean': bwd_pkt_len,
            ' Bwd Packet Length Std': random.uniform(0, 200),
            'Flow Bytes/s': random.uniform(0, 1000000),
            ' Flow Packets/s': random.uniform(0, 2000),
            ' Flow IAT Mean': random.uniform(0, 1000000),
            ' Flow IAT Std': random.uniform(0, 1000000),
            ' Flow IAT Max': random.uniform(0, 10000000),
            ' Flow IAT Min': random.uniform(0, 100000),
            'Fwd IAT Total': random.uniform(0, 10000000),
            ' Fwd IAT Mean': random.uniform(0, 1000000),
            ' Fwd IAT Std': random.uniform(0, 1000000),
            ' Fwd IAT Max': random.uniform(0, 10000000),
            ' Fwd IAT Min': random.uniform(0, 100000),
            'Bwd IAT Total': random.uniform(0, 10000000),
            ' Bwd IAT Mean': random.uniform(0, 1000000),
            ' Bwd IAT Std': random.uniform(0, 1000000),
            ' Bwd IAT Max': random.uniform(0, 10000000),
            ' Bwd IAT Min': random.uniform(0, 100000),
            'Fwd PSH Flags': random.randint(0, 1),
            ' Bwd PSH Flags': 0,
            ' Fwd URG Flags': random.randint(0, 1),
            ' Bwd URG Flags': 0,
            ' Fwd Header Length': random.randint(0, 100),
            ' Bwd Header Length': random.randint(0, 100),
            'Fwd Packets/s': random.uniform(0, 2000),
            ' Bwd Packets/s': random.uniform(0, 1000),
            ' Min Packet Length': random.uniform(0, 100),
            ' Max Packet Length': random.uniform(0, 1500),
            ' Packet Length Mean': random.uniform(0, 500),
            ' Packet Length Std': random.uniform(0, 300),
            ' Packet Length Variance': random.uniform(0, 90000),
            'FIN Flag Count': random.randint(0, 1),
            ' SYN Flag Count': random.randint(0, 10),
            ' RST Flag Count': random.randint(0, 5),
            ' PSH Flag Count': random.randint(0, 10),
            ' ACK Flag Count': random.randint(0, 20),
            ' URG Flag Count': random.randint(0, 1),
            ' CWE Flag Count': random.randint(0, 1),
            ' ECE Flag Count': random.randint(0, 1),
            ' Down/Up Ratio': random.uniform(0, 10),
            ' Average Packet Size': random.uniform(0, 500),
            ' Avg Fwd Segment Size': fwd_pkt_len,
            ' Avg Bwd Segment Size': bwd_pkt_len,
            ' Fwd Header Length.1': random.randint(0, 100),
            'Fwd Avg Bytes/Bulk': 0,
            ' Fwd Avg Packets/Bulk': 0,
            ' Fwd Avg Bulk Rate': 0,
            ' Bwd Avg Bytes/Bulk': 0,
            ' Bwd Avg Packets/Bulk': 0,
            'Bwd Avg Bulk Rate': 0,
            'Subflow Fwd Packets': random.randint(0, 100),
            ' Subflow Fwd Bytes': random.uniform(0, 10000),
            ' Subflow Bwd Packets': random.randint(0, 100),
            ' Subflow Bwd Bytes': random.uniform(0, 10000),
            'Init_Win_bytes_forward': random.randint(0, 65535),
            ' Init_Win_bytes_backward': random.randint(0, 65535),
            ' act_data_pkt_fwd': random.randint(0, 100),
            ' min_seg_size_forward': random.randint(0, 100),
            'Active Mean': random.uniform(0, 1000000),
            ' Active Std': random.uniform(0, 500000),
            ' Active Max': random.uniform(0, 5000000),
            ' Active Min': random.uniform(0, 500000),
            'Idle Mean': random.uniform(0, 10000000),
            ' Idle Std': random.uniform(0, 5000000),
            ' Idle Max': random.uniform(0, 50000000),
            ' Idle Min': random.uniform(0, 5000000),
        }
    
    def _update_stats(self, traffic):
        self.stats['total_detections'] += 1
        if traffic['is_threat'] and traffic['confidence'] >= config.ALERT_THRESHOLD / 100:
            self.stats['active_threats'] += 1
        
        # Update attack distribution
        attack_cat = traffic['attack_type']
        if attack_cat in self.stats['attack_distribution']:
            self.stats['attack_distribution'][attack_cat] += 1
        else:
            self.stats['attack_distribution'][attack_cat] = 1
    
    def get_status(self):
        return {
            'active': self.active,
            'stats': self.stats,
            'current_logs': self.current_logs,
            'total_logs': len(self.all_logs)
        }
    
    def clear(self):
        self.current_logs = []
        self.all_logs = []
        self.stats = {
            'total_detections': 0,
            'active_threats': 0,
            'monitoring_time': 0,
            'attack_distribution': {cat: 0 for cat in ATTACK_CATEGORIES}
        }
    
    def reset(self):
        self.stop()
        self.clear()

# ============ Initialize Components ============
cnn_lstm = CNNLSTMModel()
email_alerts = EmailAlertSystem()
traffic_monitor = TrafficMonitor()

# ============ API Endpoints ============
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 400

    new_user = User(email=email, password=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'User registered successfully'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@app.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out'})

@app.route('/api/forgot_password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Password updated'})



@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': cnn_lstm.is_loaded,
        'model_accuracy': cnn_lstm.accuracy,
        'monitoring_active': traffic_monitor.active,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'model_type': 'CNN-LSTM',
        'accuracy': cnn_lstm.accuracy,
        'model_loaded': cnn_lstm.is_loaded,
        'num_classes': cnn_lstm.num_classes,
        'classes': cnn_lstm.label_encoder.classes_.tolist() if cnn_lstm.label_encoder else [],
        'attack_categories': ATTACK_CATEGORIES,
        'input_features': 78,
        'sequence_length': 5
    })

@app.route('/api/monitoring/start', methods=['POST'])
def start_monitoring():
    if not traffic_monitor.active:
        traffic_monitor.start()
        return jsonify({'success': True, 'message': 'Monitoring started'})
    return jsonify({'success': False, 'message': 'Already active'})

@app.route('/api/monitoring/stop', methods=['POST'])
def stop_monitoring():
    if traffic_monitor.active:
        traffic_monitor.stop()
        return jsonify({'success': True, 'message': 'Monitoring stopped'})
    return jsonify({'success': False, 'message': 'Not active'})

@app.route('/api/monitoring/status', methods=['GET'])
def monitoring_status():
    return jsonify(traffic_monitor.get_status())

@app.route('/api/monitoring/mode', methods=['GET', 'POST'])
def monitoring_mode():
    if request.method == 'GET':
        return jsonify({'mode': traffic_monitor.mode})
    data = request.get_json()
    mode = data.get('mode', 'auto')
    if mode not in ['auto', 'manual']:
        return jsonify({'error': 'Mode must be auto or manual'}), 400
    traffic_monitor.mode = mode
    return jsonify({'success': True, 'mode': mode})

@app.route('/api/monitoring/inject', methods=['POST'])
def inject_traffic():
    if not traffic_monitor.active:
        return jsonify({'error': 'Start monitoring first'}), 400

    data = request.get_json() or {}
    predicted_class, confidence = cnn_lstm.predict(data)

    if predicted_class == 'BENIGN':
        fallback_class, fallback_conf = cnn_lstm.fallback_prediction(data)
        if fallback_class != 'BENIGN':
            predicted_class = fallback_class
            confidence = fallback_conf

    display_name = get_display_name(predicted_class)
    severity = get_severity(confidence, display_name)

    traffic = {
        'id': random.randint(10000, 99999),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'source_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
        'dest_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
        'attack_type': display_name,
        'original_class': predicted_class,
        'confidence': confidence,
        'severity': severity,
        'is_threat': display_name != 'BENIGN'
    }

    traffic_monitor._push_traffic(traffic)
    return jsonify({'success': True, 'traffic': traffic})

@app.route('/api/monitoring/reset', methods=['POST'])
def reset_monitoring():
    traffic_monitor.reset()
    return jsonify({'success': True, 'message': 'Reset complete'})

@app.route('/api/monitoring/clear_logs', methods=['POST'])
def clear_logs():
    traffic_monitor.clear()
    return jsonify({'success': True, 'message': 'Logs cleared'})

@app.route('/api/threshold', methods=['GET', 'POST'])
def threshold():
    global config
    if request.method == 'GET':
        return jsonify({'threshold': config.ALERT_THRESHOLD})
    
    data = request.get_json()
    new_threshold = data.get('threshold', 80)
    if 50 <= new_threshold <= 95:
        config.ALERT_THRESHOLD = new_threshold
        return jsonify({'success': True, 'threshold': new_threshold})
    return jsonify({'error': 'Threshold must be 50-95'}), 400

@app.route('/api/email/configure', methods=['POST'])
def configure_email():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    alert_email = data.get('alert_email', '')

    email_alerts.configure(username=username, password=password, alert_email=alert_email)

    config = EmailConfig.query.first()
    if config:
        config.username = username
        config.password = password
        config.alert_email = alert_email
    else:
        config = EmailConfig(username=username, password=password, alert_email=alert_email)
        db.session.add(config)
    db.session.commit()

    return jsonify({
        'success': True,
        'enabled': email_alerts.enabled,
        'message': 'Email configured' if email_alerts.enabled else 'Email disabled'
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data'}), 400
        
        predicted_class, confidence = cnn_lstm.predict(data)
        display_name = get_display_name(predicted_class)
        severity = get_severity(confidence, display_name)
        
        return jsonify({
            'success': True,
            'prediction': {
                'attack_type': display_name,
                'original_class': predicted_class,
                'confidence': confidence,
                'severity': severity,
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    num = data.get('num_samples', 10)
    
    results = []
    for _ in range(num):
        features = traffic_monitor._generate_features()
        pred_class, conf = cnn_lstm.predict(features)
        
        results.append({
            'timestamp': datetime.now().isoformat(),
            'source_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
            'dest_ip': f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
            'attack_type': get_display_name(pred_class),
            'confidence': conf,
            'severity': get_severity(conf, get_display_name(pred_class))
        })
    
    return jsonify({'success': True, 'traffic': results})

# ============ WebSocket Events ============
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connected', {'message': 'Connected to SecureNet AI'})

@socketio.on('start_monitoring')
def handle_start():
    if not traffic_monitor.active:
        traffic_monitor.start()
        emit('monitoring_started', {'status': 'active'})

@socketio.on('stop_monitoring')
def handle_stop():
    if traffic_monitor.active:
        traffic_monitor.stop()
        emit('monitoring_stopped', {'status': 'inactive'})



# ============ Main ============
def load_email_config():
    config = EmailConfig.query.first()
    if config and config.username:
        email_alerts.configure(
            username=config.username,
            password=config.password,
            alert_email=config.alert_email
        )
        logger.info("✅ Email config loaded from database")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        load_email_config()
        if not User.query.filter_by(email='demo@securenet.ai').first():
            demo_user = User(email='demo@securenet.ai', password=generate_password_hash('demo123'))
            db.session.add(demo_user)
            db.session.commit()
            logger.info("✅ Demo user created")
    print("=" * 60)
    print("🚀 SecureNet AI Backend Server")
    print("=" * 60)
    print(f"📡 API: http://localhost:5000")
    print(f"🔍 Health: http://localhost:5000/api/health")
    print(f"📊 Model Info: http://localhost:5000/api/model/info")
    print(f"🎮 Monitor: http://localhost:5000/api/monitoring/status")
    print("=" * 60)
    print(f"✅ Model Loaded: {cnn_lstm.is_loaded}")
    print(f"✅ Model Accuracy: {cnn_lstm.accuracy}%")
    print(f"✅ Attack Classes: {cnn_lstm.num_classes}")
    print("=" * 60)
    print("🚀 Server running! Press Ctrl+C to stop")
    print("=" * 60)
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)