"""
Windows-compatible hot-reload dev server for The Village backend.
Replaces uvicorn --reload which crashes on Windows due to CTRL_C_EVENT signal issue.
Usage: python dev.py
"""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

WATCH_DIR = Path(__file__).parent
UVICORN_CMD = [sys.executable, "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]

def start_server():
    return subprocess.Popen(
        UVICORN_CMD,
        cwd=WATCH_DIR,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )

def get_mtimes():
    return {
        p: p.stat().st_mtime
        for p in WATCH_DIR.glob("*.py")
        if p.name != "dev.py"
    }

def main():
    print("=== The Village Backend Dev Server (Windows hot-reload) ===")
    print(f"Watching: {WATCH_DIR}")

    proc = start_server()
    print(f"Started server PID {proc.pid}")

    mtimes = get_mtimes()

    try:
        while True:
            time.sleep(1)

            # Check if process died unexpectedly
            if proc.poll() is not None:
                print(f"\nServer exited (code {proc.returncode}), restarting...")
                proc = start_server()
                mtimes = get_mtimes()
                continue

            # Check for file changes
            new_mtimes = get_mtimes()
            changed = [p for p, t in new_mtimes.items() if mtimes.get(p) != t]

            if changed:
                for p in changed:
                    print(f"\n>>> Changed: {p.name}")
                print("Restarting server...")

                # Terminate the old process cleanly on Windows
                try:
                    proc.send_signal(signal.CTRL_BREAK_EVENT)
                    proc.wait(timeout=5)
                except Exception:
                    proc.kill()
                    proc.wait()

                proc = start_server()
                print(f"Restarted server PID {proc.pid}")
                mtimes = new_mtimes

    except KeyboardInterrupt:
        print("\nShutting down...")
        try:
            proc.send_signal(signal.CTRL_BREAK_EVENT)
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        print("Done.")

if __name__ == "__main__":
    main()
