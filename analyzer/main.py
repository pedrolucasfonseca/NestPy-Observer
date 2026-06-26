import json
import time
import os
from collections import deque

LOG_PATH = "/app/logs/app.log"

# deque allows fast appends to the end and pops from the front
logs_queue = deque()

# used to store counters with O(1) lookup and update
metrics = {
    "INFO": 0,
    "WARN": 0,
    "ERROR": 0,
    "total_processed": 0
}

def display_dashboard():
    """Clears the terminal and displays the current metrics status."""
    os.system('clear' if os.name == 'posix' else 'cls')
    print("=" * 45)
    print(" Real-Time Telemetry (NestPy-Observer) ")
    print("=" * 45)
    print(f" Total Logs Processed: {metrics['total_processed']}")
    print("-" * 45)
    print(f" [INFO]  Successes: {metrics['INFO']}")
    print(f" [WARN]  Alerts/Rejected: {metrics['WARN']}")
    print(f" [ERROR] Critical Errors: {metrics['ERROR']}")
    print("=" * 45)
    print(" Watching file. Send requests to the API.")

def process_queue():
    """Dequeues logs using FIFO logic and updates the metrics."""
    while len(logs_queue) > 0:
        # popleft() removes the fist element that entered the queue (first in, first out)
        log_line = logs_queue.popleft()

        try:
            log_object = json.loads(log_line)
            level = log_object.get("level")

            # Update the counters in the hash table
            if level in metrics:
                metrics[level] += 1
                metrics["total_processed"] += 1

        except json.JSONDecodeError:
            # Skip malformed lines (e.g. partial writes from the API)
            pass

def watch_logs():
    """Watches app.log in real time, similar to the `tail -f` command."""
    print(f"Looking for log file at: {LOG_PATH}")

    # Wait for the API to create the file if it doesn't exist yet
    while not os.path.exists(LOG_PATH):
        print("Waiting for the API to generate the first log...")
        time.sleep(2)

    with open(LOG_PATH, "r") as log_file:
        log_file.seek(0, os.SEEK_END)

        display_dashboard()

        while True:
            line = log_file.readline()

            if line and line.strip():
                logs_queue.append(line)
                process_queue()
                display_dashboard()
            else:
                time.sleep(1)

if __name__ == "__main__":
    try:
        watch_logs()
    except KeyboardInterrupt:
        print("\nAnalyzer stopped successfully.")
