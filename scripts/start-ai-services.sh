#!/usr/bin/env bash
#
# Start (or health-check) the AgroGrowth Python AI microservices locally.
#
# Usage:
#   scripts/start-ai-services.sh            # start all eight in the background
#   scripts/start-ai-services.sh --check    # health-check the eight services
#   scripts/start-ai-services.sh --stop     # stop services started by this script
#
# Each service is a FastAPI app under agrogrowth-ai/<name>/main.py. The port is
# taken from the service's own default (PORT overrides it). Logs go to
# /tmp/agrogrowth-ai/<name>.log. Nothing here requires network access or
# credentials; the models are local.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_DIR="$ROOT/agrogrowth-ai"
VENV_PY="$AI_DIR/.venv/bin/python"
LOG_DIR="${AGRO_AI_LOG_DIR:-/tmp/agrogrowth-ai}"
PID_DIR="$LOG_DIR/pids"

# name:port — matches each main.py default and docker-compose SERVICE_PORT.
SERVICES=(
  "soil_analysis:8001"
  "crop_recommendation:8002"
  "image_diagnosis:8003"
  "market_prediction:8004"
  "intelligent_agent:8005"
  "weather_yield_intelligence:8006"
  "pest_control:8007"
  "irrigation_optimization:8008"
)

if [ ! -x "$VENV_PY" ]; then
  echo "Python venv not found at $VENV_PY" >&2
  echo "Create it with: python3 -m venv agrogrowth-ai/.venv && agrogrowth-ai/.venv/bin/pip install -r agrogrowth-ai/requirements.txt" >&2
  exit 1
fi

mkdir -p "$LOG_DIR" "$PID_DIR"

check_all() {
  local failures=0
  for entry in "${SERVICES[@]}"; do
    local name="${entry%%:*}"
    local port="${entry##*:}"
    local code
    code="$(curl -s -m 8 -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/health" || echo 000)"
    if [ "$code" = "200" ]; then
      printf "  %-32s :%s  OK\n" "$name" "$port"
    else
      printf "  %-32s :%s  DOWN (HTTP %s)\n" "$name" "$port" "$code"
      failures=$((failures + 1))
    fi
  done
  return "$failures"
}

start_all() {
  for entry in "${SERVICES[@]}"; do
    local name="${entry%%:*}"
    local port="${entry##*:}"
    if curl -s -m 2 -o /dev/null "http://127.0.0.1:${port}/health"; then
      echo "  $name already up on :$port"
      continue
    fi
    ( cd "$AI_DIR" && PORT="$port" nohup "$VENV_PY" -m uvicorn "$name.main:app" \
        --host 127.0.0.1 --port "$port" > "$LOG_DIR/$name.log" 2>&1 & echo $! > "$PID_DIR/$name.pid" )
    echo "  started $name on :$port (log: $LOG_DIR/$name.log)"
  done
  echo "Waiting for services to become healthy..."
  sleep 8
  check_all || true
}

stop_all() {
  for entry in "${SERVICES[@]}"; do
    local name="${entry%%:*}"
    local pidfile="$PID_DIR/$name.pid"
    if [ -f "$pidfile" ]; then
      local pid
      pid="$(cat "$pidfile")"
      if kill "$pid" 2>/dev/null; then
        echo "  stopped $name (pid $pid)"
      fi
      rm -f "$pidfile"
    fi
  done
}

case "${1:-}" in
  --check) check_all ;;
  --stop) stop_all ;;
  *) start_all ;;
esac
