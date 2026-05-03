import tensorflow as tf
import pickle
import numpy as np

# Convert your trained model to the required format
def convert_model():
    # Load your trained model from the notebook
    # If you have the model in memory, save it directly
    
    # If you have the model saved as .h5 or .keras, load it
    try:
        model = tf.keras.models.load_model('cnn_lstm_intrusion_model.keras')
        model.save('model/cnn_lstm_intrusion_model.keras')
        print("✅ Model converted and saved!")
    except:
        print("❌ Could not load model. Please ensure model file exists.")

if __name__ == '__main__':
    convert_model()