import numpy as np
import pandas as pd
import pickle
import random
import os

class NetworkTrafficPreprocessor:
    def __init__(self, model_path='model/'):
        """Initialize preprocessor with saved scaler and feature columns"""
        self.model_path = model_path
        self.scaler = None
        self.feature_columns = None
        self.label_encoder = None
        
        # Load preprocessor files
        self.load_preprocessors()
    
    def load_preprocessors(self):
        """Load scaler and feature columns"""
        try:
            # Load scaler
            with open(f'{self.model_path}/scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            print("✅ Scaler loaded successfully")
            
            # Load feature columns
            with open(f'{self.model_path}/feature_columns.pkl', 'rb') as f:
                self.feature_columns = pickle.load(f)
            print(f"✅ Feature columns loaded: {len(self.feature_columns)} features")
            
            # Load label encoder
            with open(f'{self.model_path}/label_encoder.pkl', 'rb') as f:
                self.label_encoder = pickle.load(f)
            print(f"✅ Label encoder loaded: {self.label_encoder.classes_}")
            
        except Exception as e:
            print(f"❌ Error loading preprocessors: {e}")
            raise
    
    def create_sequence(self, data, seq_length=5):
        """Create sequences for LSTM input"""
        if len(data) < seq_length:
            # If not enough data, duplicate the last row to create sequence
            data = np.vstack([data] * (seq_length - len(data) + 1))
        
        sequences = []
        for i in range(len(data) - seq_length + 1):
            sequences.append(data[i:i+seq_length])
        
        return np.array(sequences)
    
    def preprocess_single_sample(self, sample):
        """
        Preprocess a single network traffic sample
        
        Args:
            sample: dict of network traffic features
        
        Returns:
            Preprocessed numpy array ready for model prediction
        """
        # Convert to DataFrame
        df = pd.DataFrame([sample])
        
        # Ensure all required columns exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Select only required features in correct order
        df = df[self.feature_columns]
        
        # Handle missing values
        df = df.fillna(0)
        
        # Replace infinite values
        df = df.replace([np.inf, -np.inf], 0)
        
        # Scale features
        scaled_data = self.scaler.transform(df)
        
        # Create sequence
        sequence = self.create_sequence(scaled_data, seq_length=5)
        
        return sequence
    
    def generate_random_features(self):
        """Generate random network traffic features for simulation"""
        sample = {}
        for col in self.feature_columns:
            # Generate random values based on feature type
            if 'protocol_type' in col.lower():
                sample[col] = random.choice([1, 2, 3])  # TCP, UDP, ICMP
            elif 'flag' in col.lower():
                sample[col] = random.choice([1, 2, 3, 4, 5, 6])
            elif 'service' in col.lower():
                sample[col] = random.choice([1, 2, 3, 4, 5, 6, 7, 8])
            elif col in ['count', 'srv_count', 'dst_host_count', 'dst_host_srv_count']:
                sample[col] = random.randint(1, 100)
            else:
                # Continuous features
                sample[col] = random.uniform(0, 1000)
        
        return sample

# Attack type mapping
ATTACK_TYPE_MAP = {
    'normal': 'BENIGN',
    'benign': 'BENIGN',
    'dos': 'DoS',
    'neptune': 'DoS',
    'smurf': 'DoS',
    'back': 'DoS',
    'teardrop': 'DoS',
    'pod': 'DoS',
    'land': 'DoS',
    'probe': 'PortScan',
    'portsweep': 'PortScan',
    'ipsweep': 'PortScan',
    'nmap': 'PortScan',
    'satan': 'PortScan',
    'r2l': 'BruteForce',
    'guess_passwd': 'BruteForce',
    'ftp_write': 'BruteForce',
    'imap': 'BruteForce',
    'multihop': 'BruteForce',
    'phf': 'BruteForce',
    'spy': 'BruteForce',
    'warezclient': 'BruteForce',
    'warezmaster': 'BruteForce',
    'u2r': 'WebAttack',
    'buffer_overflow': 'WebAttack',
    'loadmodule': 'WebAttack',
    'perl': 'WebAttack',
    'rootkit': 'WebAttack',
    'xterm': 'WebAttack',
    'ps': 'WebAttack',
    'sqlattack': 'WebAttack',
    'xlock': 'WebAttack',
    'xsnoop': 'WebAttack'
}

def map_attack_type(original_class):
    """Map original class to display-friendly attack type"""
    original_lower = original_class.lower()
    
    if original_lower in ATTACK_TYPE_MAP:
        return ATTACK_TYPE_MAP[original_lower]
    
    return original_class

def get_severity(confidence, attack_type):
    """Determine severity based on confidence and attack type"""
    if attack_type == 'BENIGN':
        return 'SAFE'
    
    if confidence >= 0.85:
        return 'CRITICAL'
    elif confidence >= 0.70:
        return 'WARNING'
    elif confidence >= 0.60:
        return 'LOW RISK'
    else:
        return 'MONITOR'