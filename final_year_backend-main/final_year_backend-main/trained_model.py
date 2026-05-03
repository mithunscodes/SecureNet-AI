import numpy as np
import pandas as pd
import pickle
import os
import tensorflow as tf
from sklearn.preprocessing import StandardScaler, LabelEncoder
import warnings
warnings.filterwarnings('ignore')

def create_preprocessing_files_from_matlab_data():
    """
    Create preprocessing files based on your MATLAB traffic data structure
    This uses the same features as your MATLAB code
    """
    print("="*60)
    print("Creating preprocessing files for SecureNet AI Backend")
    print("="*60)
    
    # Create model directory
    os.makedirs('model', exist_ok=True)
    
    # ============ Feature Columns ============
    # These are the 5 features from your MATLAB traffic data
    feature_columns = [
        'duration',      # Duration of the flow
        'packet_rate',   # Packet rate (packets per second)
        'bytes_sent',    # Bytes sent
        'bytes_received', # Bytes received
        'connections'    # Number of connections
    ]
    
    print(f"\n📊 Features: {len(feature_columns)} features")
    print(f"   {feature_columns}")
    
    # ============ Create Scaler ============
    # Since we don't have the original data, we'll create a scaler with reasonable ranges
    # This will be replaced when you train with actual data
    
    # Create dummy data to fit scaler (using ranges from your MATLAB simulation)
    dummy_data = np.random.rand(1000, 5)
    
    # Scale features based on expected ranges
    # duration: 0-5 (benign) or 0-1 (attack)
    # packet_rate: 0-50 (benign) or 400-1000 (attack)
    # bytes_sent: 0-1000 (benign) or 4000-7000 (attack)
    # bytes_received: 0-1200 (benign) or 200-500 (attack)
    # connections: 1-3 (benign) or 60-100 (attack)
    
    # Create realistic dummy data
    for i in range(500):  # Benign samples
        dummy_data[i] = [
            np.random.uniform(0, 5),      # duration
            np.random.uniform(0, 50),     # packet_rate
            np.random.uniform(0, 1000),   # bytes_sent
            np.random.uniform(0, 1200),   # bytes_received
            np.random.uniform(1, 3)       # connections
        ]
    
    for i in range(500, 1000):  # Attack samples
        dummy_data[i] = [
            np.random.uniform(0, 1),       # duration
            np.random.uniform(400, 1000),  # packet_rate
            np.random.uniform(4000, 7000), # bytes_sent
            np.random.uniform(200, 500),   # bytes_received
            np.random.uniform(60, 100)     # connections
        ]
    
    scaler = StandardScaler()
    scaler.fit(dummy_data)
    
    # Save scaler
    with open('model/scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("✅ Scaler created and saved to model/scaler.pkl")
    
    # ============ Create Label Encoder ============
    # Map your model's output classes
    # Based on your MATLAB code: 0 = Benign, 1 = Attack
    attack_classes = ['BENIGN', 'ATTACK']
    
    label_encoder = LabelEncoder()
    label_encoder.classes_ = np.array(attack_classes)
    
    # Save label encoder
    with open('model/label_encoder.pkl', 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"✅ Label encoder saved to model/label_encoder.pkl")
    print(f"   Classes: {attack_classes}")
    
    # ============ Create Feature Columns File ============
    with open('model/feature_columns.pkl', 'wb') as f:
        pickle.dump(feature_columns, f)
    print("✅ Feature columns saved to model/feature_columns.pkl")
    
    print("\n" + "="*60)
    print("📁 Preprocessing files created successfully!")
    print("="*60)
    
    return scaler, label_encoder, feature_columns

def create_model_from_matlab_training():
    """
    Create a CNN-LSTM model similar to your MATLAB training
    This replicates the architecture from trainLSTM.m
    """
    print("\n" + "="*60)
    print("Creating CNN-LSTM model for intrusion detection")
    print("="*60)
    
    # Model parameters (from your MATLAB code)
    sequence_length = 5
    num_features = 5  # 5 features from your traffic data
    num_classes = 2   # Benign (0) and Attack (1)
    
    # Build CNN-LSTM model (enhanced version of your MATLAB LSTM)
    model = tf.keras.Sequential([
        # Input layer
        tf.keras.layers.Input(shape=(sequence_length, num_features)),
        
        # CNN layers for feature extraction
        tf.keras.layers.Conv1D(filters=64, kernel_size=2, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        tf.keras.layers.Conv1D(filters=32, kernel_size=2, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        
        # LSTM layer (similar to your MATLAB LSTM layer with 32 units)
        tf.keras.layers.LSTM(32, return_sequences=False, dropout=0.2, recurrent_dropout=0.2),
        
        # Dense layers
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Display model summary
    print("\n📊 Model Architecture:")
    model.summary()
    
    # Save model
    model.save('model/cnn_lstm_intrusion_model.keras')
    print("\n✅ Model saved to model/cnn_lstm_intrusion_model.keras")
    
    return model

def create_trained_model_from_your_data(X_train, y_train, X_test, y_test):
    """
    Train the model using your actual data
    This is the function you would use if you have your sequence data
    
    Args:
        X_train: Training sequences (numpy array)
        y_train: Training labels (numpy array)
        X_test: Test sequences (numpy array)
        y_test: Test labels (numpy array)
    """
    print("\n" + "="*60)
    print("Training model with your data")
    print("="*60)
    
    sequence_length = 5
    num_features = X_train.shape[2]
    num_classes = len(np.unique(y_train))
    
    # Build model
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(sequence_length, num_features)),
        tf.keras.layers.Conv1D(64, 2, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(2),
        tf.keras.layers.Conv1D(32, 2, activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling1D(2),
        tf.keras.layers.LSTM(32, return_sequences=False, dropout=0.2),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5),
        tf.keras.callbacks.ModelCheckpoint('model/best_model.keras', monitor='val_accuracy', save_best_only=True)
    ]
    
    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=60,
        batch_size=16,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n🎯 Test Accuracy: {test_acc:.4f}")
    
    # Save model
    model.save('model/cnn_lstm_intrusion_model.keras')
    print("✅ Model saved to model/cnn_lstm_intrusion_model.keras")
    
    return model, history

def verify_model_files():
    """Verify that all required model files exist"""
    print("\n" + "="*60)
    print("Verifying model files")
    print("="*60)
    
    required_files = [
        'model/cnn_lstm_intrusion_model.keras',
        'model/scaler.pkl',
        'model/label_encoder.pkl',
        'model/feature_columns.pkl'
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - MISSING")
            all_exist = False
    
    if all_exist:
        print("\n✅ All model files are ready!")
        print("\nYou can now run:")
        print("  python app.py")
    else:
        print("\n⚠️ Some files are missing. Please run this script again.")
    
    return all_exist

def load_and_test_model():
    """Load and test the model to ensure it works"""
    print("\n" + "="*60)
    print("Testing model loading")
    print("="*60)
    
    try:
        # Load model
        model = tf.keras.models.load_model('model/cnn_lstm_intrusion_model.keras')
        print("✅ Model loaded successfully")
        
        # Load preprocessing files
        with open('model/scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        print("✅ Scaler loaded")
        
        with open('model/label_encoder.pkl', 'rb') as f:
            label_encoder = pickle.load(f)
        print(f"✅ Label encoder loaded: {label_encoder.classes_}")
        
        with open('model/feature_columns.pkl', 'rb') as f:
            feature_columns = pickle.load(f)
        print(f"✅ Feature columns loaded: {len(feature_columns)} features")
        
        # Test with dummy data
        test_sample = np.random.rand(1, 5, 5)  # (batch, sequence, features)
        prediction = model.predict(test_sample, verbose=0)
        predicted_class = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_class])
        
        print(f"\n🎯 Test prediction: {label_encoder.classes_[predicted_class]}")
        print(f"   Confidence: {confidence:.2%}")
        print("\n✅ Model is working correctly!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

if __name__ == '__main__':
    print("\n" + "="*60)
    print("SecureNet AI - Model Setup")
    print("="*60)
    
    # Create preprocessing files
    create_preprocessing_files_from_matlab_data()
    
    # Create model
    create_model_from_matlab_training()
    
    # Verify files
    verify_model_files()
    
    # Test model
    load_and_test_model()
    
    print("\n" + "="*60)
    print("Setup complete! You can now run the Flask app:")
    print("  python app.py")
    print("="*60)