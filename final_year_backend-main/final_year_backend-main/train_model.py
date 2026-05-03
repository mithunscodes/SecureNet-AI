# train_model.py
import numpy as np
import pandas as pd
import pickle
import os
import tensorflow as tf
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

def generate_training_data():
    """
    Generate training data based on your MATLAB traffic simulation
    This creates realistic traffic patterns matching your MATLAB code
    """
    print("="*60)
    print("Generating training data (simulating your MATLAB traffic data)")
    print("="*60)
    
    num_samples = 1000
    
    # Generate benign traffic (class 0)
    benign_data = np.zeros((num_samples, 5))
    for i in range(num_samples):
        benign_data[i, 0] = np.random.rand() * 5           # duration
        benign_data[i, 1] = np.random.rand() * 50          # packet rate
        benign_data[i, 2] = np.random.rand() * 1000        # bytes sent
        benign_data[i, 3] = np.random.rand() * 1200        # bytes received
        benign_data[i, 4] = np.random.randint(1, 4)        # connections
    
    benign_labels = np.zeros(num_samples)
    
    # Generate attack traffic (class 1)
    attack_data = np.zeros((num_samples, 5))
    packet_rate = 400
    bytes_sent = 4000
    
    for i in range(num_samples):
        packet_rate += np.random.rand() * 20
        bytes_sent += np.random.rand() * 150
        
        attack_data[i, 0] = np.random.rand() * 1           # duration
        attack_data[i, 1] = packet_rate                    # packet rate (ramping)
        attack_data[i, 2] = bytes_sent                     # bytes sent (ramping)
        attack_data[i, 3] = 200 + np.random.rand() * 300   # bytes received
        attack_data[i, 4] = np.random.randint(60, 101)     # connections
    
    attack_labels = np.ones(num_samples)
    
    # Combine data
    data = np.vstack([benign_data, attack_data])
    labels = np.hstack([benign_labels, attack_labels])
    
    # Shuffle
    idx = np.random.permutation(data.shape[0])
    data = data[idx]
    labels = labels[idx]
    
    print(f"Generated {len(data)} samples")
    print(f"  Benign (0): {np.sum(labels == 0)}")
    print(f"  Attack (1): {np.sum(labels == 1)}")
    
    return data, labels

def create_sequences(data, labels, seq_length=5):
    """Create sequences for LSTM input (matching your MATLAB createSequences.m)"""
    X = []
    Y = []
    
    for i in range(0, len(data) - seq_length + 1):
        seq_data = data[i:i+seq_length, :]
        X.append(seq_data)
        
        # Majority vote for label (matching MATLAB mode)
        label_slice = labels[i:i+seq_length]
        unique, counts = np.unique(label_slice, return_counts=True)
        majority_label = unique[np.argmax(counts)]
        Y.append(majority_label)
    
    X = np.array(X)
    Y = np.array(Y)
    
    print(f"\nCreated sequences:")
    print(f"  X shape: {X.shape}")
    print(f"  Y shape: {Y.shape}")
    
    return X, Y

def build_cnn_lstm_model(seq_length=5, n_features=5, n_classes=2):
    """
    Build CNN-LSTM model
    This is an enhanced version of your MATLAB LSTM model
    """
    model = tf.keras.Sequential([
        # Input layer
        tf.keras.layers.Input(shape=(seq_length, n_features)),
        
        # CNN layers for feature extraction (additional compared to MATLAB)
        tf.keras.layers.Conv1D(filters=64, kernel_size=3, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        tf.keras.layers.Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        # LSTM layer (matches your MATLAB LSTM layer)
        tf.keras.layers.LSTM(32, return_sequences=False, dropout=0.2),
        
        # Dense layers
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(n_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def save_preprocessing_objects(scaler, label_encoder, feature_columns):
    """Save preprocessing objects for the Flask app"""
    os.makedirs('model', exist_ok=True)
    
    with open('model/scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("✅ Scaler saved to model/scaler.pkl")
    
    with open('model/label_encoder.pkl', 'wb') as f:
        pickle.dump(label_encoder, f)
    print("✅ Label encoder saved to model/label_encoder.pkl")
    
    with open('model/feature_columns.pkl', 'wb') as f:
        pickle.dump(feature_columns, f)
    print("✅ Feature columns saved to model/feature_columns.pkl")

def train_and_save_model():
    """Main training function"""
    print("\n" + "="*60)
    print("TRAINING CNN-LSTM INTRUSION DETECTION MODEL")
    print("="*60)
    
    # Step 1: Generate training data (simulating your MATLAB trafficData.mat)
    data, labels = generate_training_data()
    
    # Step 2: Scale features
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)
    
    # Step 3: Create sequences
    seq_length = 5
    X, Y = create_sequences(data_scaled, labels, seq_length)
    
    # Step 4: Train-test split
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42, stratify=Y
    )
    
    print(f"\nTraining set: {X_train.shape}")
    print(f"Test set: {X_test.shape}")
    
    # Step 5: Build model
    n_features = X.shape[2]
    n_classes = len(np.unique(Y))
    
    model = build_cnn_lstm_model(seq_length, n_features, n_classes)
    
    print("\nModel Architecture:")
    model.summary()
    
    # Step 6: Train model
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5),
        tf.keras.callbacks.ModelCheckpoint('model/best_model.keras', monitor='val_accuracy', save_best_only=True)
    ]
    
    print("\nTraining model...")
    history = model.fit(
        X_train, Y_train,
        validation_data=(X_test, Y_test),
        epochs=60,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    # Step 7: Evaluate
    test_loss, test_acc = model.evaluate(X_test, Y_test, verbose=0)
    print(f"\n🎯 Test Accuracy: {test_acc:.4f}")
    
    # Step 8: Save model
    model.save('model/cnn_lstm_intrusion_model.keras')
    print("✅ Model saved to model/cnn_lstm_intrusion_model.keras")
    
    # Step 9: Save preprocessing objects
    # feature_columns = ['duration', 'packet_rate', 'bytes_sent', 'bytes_received', 'connections']
    label_encoder = LabelEncoder()
    label_encoder.classes_ = np.array(['BENIGN', 'ATTACK'])
    
    save_preprocessing_objects(scaler, label_encoder, feature_columns)
    
    return model, scaler, label_encoder, history

def verify_setup():
    """Verify all files are properly created"""
    print("\n" + "="*60)
    print("VERIFYING SETUP")
    print("="*60)
    
    required_files = [
        'model/cnn_lstm_intrusion_model.keras',
        'model/scaler.pkl',
        'model/label_encoder.pkl',
        'model/feature_columns.pkl'
    ]
    
    all_ok = True
    for file in required_files:
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"✅ {file} ({size} bytes)")
        else:
            print(f"❌ {file} - MISSING")
            all_ok = False
    
    return all_ok

if __name__ == '__main__':
    # Train the model
    model, scaler, label_encoder, history = train_and_save_model()
    
    # Verify setup
    if verify_setup():
        print("\n" + "="*60)
        print("✅ SETUP COMPLETE!")
        print("="*60)
        print("\nYou can now start the Flask app:")
        print("  python app.py")
        print("\nAnd test the API:")
        print("  python test_api.py")
    else:
        print("\n⚠️ Some files are missing. Please check the errors above.")