# test_live.py - Simple test script
import requests
import time

API_URL = "http://localhost:5000"

# Start monitoring
response = requests.post(f"{API_URL}/api/monitoring/start")
print("Monitoring started:", response.json())

# Check status
time.sleep(5)
response = requests.get(f"{API_URL}/api/monitoring/status")
print("\nMonitoring Status:", response.json())

# Stop monitoring
time.sleep(5)
response = requests.post(f"{API_URL}/api/monitoring/stop")
print("\nMonitoring stopped:", response.json())