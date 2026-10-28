import time
import subprocess
import sys
import httpx

def main():
    print("Starting uvicorn server for live probe...")
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd="backend",
    )

    try:
        started = False
        for attempt in range(25):
            time.sleep(0.4)
            try:
                r = httpx.get("http://127.0.0.1:8000/api/v1/health", timeout=2.0)
                if r.status_code == 200:
                    print("HEALTH CHECK SUCCESS:", r.json())
                    started = True
                    break
            except Exception:
                continue

        if not started:
            print("ERROR: Server failed to respond within timeout.")
            sys.exit(1)

        # Test Swagger documentation endpoint
        docs_res = httpx.get("http://127.0.0.1:8000/docs", timeout=2.0)
        print(f"SWAGGER /docs STATUS: {docs_res.status_code}")
        assert docs_res.status_code == 200, f"Expected 200, got {docs_res.status_code}"

        # Test OpenAPI JSON schema endpoint
        openapi_res = httpx.get("http://127.0.0.1:8000/openapi.json", timeout=2.0)
        print(f"OPENAPI /openapi.json STATUS: {openapi_res.status_code}")
        assert openapi_res.status_code == 200, f"Expected 200, got {openapi_res.status_code}"

        print("--> ALL LIVE SERVER CHECKS PASSED SUCCESSFULLY!")
    finally:
        process.terminate()
        process.wait()

if __name__ == "__main__":
    main()
