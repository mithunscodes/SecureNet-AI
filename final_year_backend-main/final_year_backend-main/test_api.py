import requests
import json
import random

# API URL
API_URL = "http://localhost:5000"


def generate_test_features():
    return {
        ' Flow Packets/s': random.uniform(0, 2000),
        ' Flow Duration': random.uniform(0, 100),
        ' Total Fwd Packets': random.randint(0, 1000),
        ' Total Backward Packets': random.randint(0, 500),
        'Total Length of Fwd Packets': random.uniform(0, 10000),
        ' Total Length of Bwd Packets': random.uniform(0, 5000),
        ' Fwd Packet Length Mean': random.uniform(0, 500),
        ' Bwd Packet Length Mean': random.uniform(0, 500),
        ' Flow Bytes/s': random.uniform(0, 50000),
        ' Fwd Header Length': random.randint(0, 100),
        ' Bwd Header Length': random.randint(0, 100),
        ' SYN Flag Count': random.randint(0, 10),
        ' ACK Flag Count': random.randint(0, 20),
        ' RST Flag Count': random.randint(0, 5),
        ' Init_Win_bytes_forward': random.randint(0, 65535),
        ' Init_Win_bytes_backward': random.randint(0, 65535)
    }

def test_health():
    """Test health endpoint"""
    print("=" * 50)
    print("Testing Health Endpoint")
    print("=" * 50)
    response = requests.get(f"{API_URL}/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_prediction():
    """Test prediction endpoint"""
    print("=" * 50)
    print("Testing Prediction Endpoint")
    print("=" * 50)
    
    # Test data
    # test_data = {
    #     "count": 85,
    #     "dst_host_count": 75,
    #     "duration": 2.5,
    #     "serror_rate": 0.3,
    #     "protocol_type": 2,
    #     "service": 3,
    #     "flag": 2,
    #     "src_bytes": 500,
    #     "dst_bytes": 600
    # }
    
    test_data = generate_test_features()
    
    print(f"Sending data: {json.dumps(test_data, indent=2)}")
    print()
    
    response = requests.post(f"{API_URL}/api/predict", json=test_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_simulation():
    """Test traffic simulation endpoint"""
    print("=" * 50)
    print("Testing Traffic Simulation")
    print("=" * 50)
    
    response = requests.post(f"{API_URL}/api/simulate", json={"num_samples": 3})
    print(f"Status Code: {response.status_code}")
    
    data = response.json()
    print(f"Generated {len(data.get('traffic', []))} traffic samples")
    
    for i, traffic in enumerate(data.get('traffic', [])[:3], 1):
        print(f"\nSample {i}:")
        print(f"  Time: {traffic.get('timestamp')}")
        print(f"  Source: {traffic.get('source_ip')}")
        print(f"  Destination: {traffic.get('dest_ip')}")
        print(f"  Attack: {traffic.get('attack_type')}")
        print(f"  Confidence: {traffic.get('confidence'):.2%}")
        print(f"  Severity: {traffic.get('severity')}")
    print()

def test_model_info():
    """Test model info endpoint"""
    print("=" * 50)
    print("Testing Model Info Endpoint")
    print("=" * 50)
    response = requests.get(f"{API_URL}/api/model_info")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

if __name__ == "__main__":
    try:
        test_health()
        test_prediction()
        test_simulation()
        test_model_info()
        print("✅ All tests completed successfully!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the server!")
        print("Make sure the Flask server is running:")
        print("  python app.py")
    except Exception as e:
        print(f"❌ Error: {e}")