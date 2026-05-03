import requests
import json
import random
import time

# API endpoint
API_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{API_URL}/api/health")
    print("Health Check:", response.json())

def test_prediction():
    """Test single prediction"""
    # sample_data = {
    #     'duration': 0.5,
    #     'protocol_type': 2,
    #     'service': 3,
    #     'flag': 2,
    #     'src_bytes': 100,
    #     'dst_bytes': 200,
    #     'land': 0,
    #     'wrong_fragment': 0,
    #     'urgent': 0,
    #     'hot': 0,
    #     'num_failed_logins': 0,
    #     'logged_in': 1,
    #     'num_compromised': 0,
    #     'root_shell': 0,
    #     'su_attempted': 0,
    #     'num_root': 0,
    #     'num_file_creations': 0,
    #     'num_shells': 0,
    #     'num_access_files': 0,
    #     'num_outbound_cmds': 0,
    #     'is_host_login': 0,
    #     'is_guest_login': 0,
    #     'count': 10,
    #     'srv_count': 8,
    #     'serror_rate': 0.1,
    #     'srv_serror_rate': 0.05,
    #     'rerror_rate': 0.0,
    #     'srv_rerror_rate': 0.0,
    #     'same_srv_rate': 0.8,
    #     'diff_srv_rate': 0.2,
    #     'srv_diff_host_rate': 0.1,
    #     'dst_host_count': 50,
    #     'dst_host_srv_count': 40,
    #     'dst_host_same_srv_rate': 0.7,
    #     'dst_host_diff_srv_rate': 0.3,
    #     'dst_host_same_src_port_rate': 0.5,
    #     'dst_host_srv_diff_host_rate': 0.2,
    #     'dst_host_serror_rate': 0.05,
    #     'dst_host_srv_serror_rate': 0.03,
    #     'dst_host_rerror_rate': 0.0,
    #     'dst_host_srv_rerror_rate': 0.0
    # }
    sample_data = traffic_monitor._generate_features()
    
    response = requests.post(f"{API_URL}/api/predict", json=sample_data)
    print("Prediction Result:", json.dumps(response.json(), indent=2))

def test_simulation():
    """Test traffic simulation"""
    response = requests.post(f"{API_URL}/api/simulate_traffic", json={'num_samples': 5})
    print("Simulated Traffic:", json.dumps(response.json(), indent=2))

if __name__ == '__main__':
    print("Testing Flask API...")
    time.sleep(1)
    test_health()
    print("\n" + "="*50)
    test_prediction()
    print("\n" + "="*50)
    test_simulation()