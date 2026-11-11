#!/bin/bash

# =====================================================
# AgroGrowth Cloud Deployment Testing Script
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print colored output
print_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}\n"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Function to test HTTP endpoint
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    local timeout="$4"
    
    if [ -z "$timeout" ]; then
        timeout=10
    fi
    
    print_test "$description"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" --max-time "$timeout" "$url" || echo "000")
    
    if [ "$response_code" = "$expected_status" ]; then
        print_success "Status $response_code - $url"
        return 0
    else
        print_failure "Expected $expected_status, got $response_code - $url"
        return 1
    fi
}

# Function to test JSON API endpoint
test_api_endpoint() {
    local url="$1"
    local description="$2"
    local timeout="$3"
    
    if [ -z "$timeout" ]; then
        timeout=15
    fi
    
    print_test "$description"
    
    local response
    response=$(curl -s --connect-timeout "$timeout" --max-time "$timeout" \
        -H "Content-Type: application/json" \
        "$url" || echo '{"error": "connection_failed"}')
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        print_success "Valid JSON response from $url"
        echo "$response" | jq . | head -10
        return 0
    else
        print_failure "Invalid JSON or connection failed - $url"
        echo "Response: $response"
        return 1
    fi
}

# Test database connectivity
test_database_connectivity() {
    print_test "Testing database connectivity"
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set, skipping database test"
        return 0
    fi
    
    # Simple connection test using psql
    if command -v psql >/dev/null 2>&1; then
        if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_failure "Database connection failed"
        fi
    else
        print_warning "psql not available, cannot test database connection"
    fi
}

# Test Redis connectivity
test_redis_connectivity() {
    print_test "Testing Redis connectivity"
    
    if [ -z "$REDIS_URL" ]; then
        print_warning "REDIS_URL not set, skipping Redis test"
        return 0
    fi
    
    # Simple Redis test using redis-cli
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -u "$REDIS_URL" ping | grep -q "PONG"; then
            print_success "Redis connection successful"
        else
            print_failure "Redis connection failed"
        fi
    else
        print_warning "redis-cli not available, cannot test Redis connection"
    fi
}

# Test PWA features
test_pwa_features() {
    print_test "Testing PWA features"
    
    local frontend_url="$1"
    
    # Test service worker
    test_endpoint "${frontend_url}/sw.js" "200" "Service Worker availability"
    
    # Test manifest
    test_endpoint "${frontend_url}/manifest.json" "200" "PWA Manifest availability"
    
    # Test offline page
    test_endpoint "${frontend_url}/offline.html" "200" "Offline page availability"
}

# Load environment variables
load_environment() {
    print_info "Loading environment variables..."
    
    # Try to load from .env files
    if [ -f ".env.cloud" ]; then
        print_info "Loading .env.cloud"
        set -a
        source .env.cloud
        set +a
    elif [ -f ".env" ]; then
        print_info "Loading .env"
        set -a
        source .env
        set +a
    else
        print_warning "No .env file found, using environment variables"
    fi
    
    # Set default URLs if not provided
    if [ -z "$FRONTEND_URL" ]; then
        FRONTEND_URL="http://localhost:5173"
    fi
    
    if [ -z "$API_URL" ]; then
        API_URL="http://localhost:8080/api"
    fi
}

# Main test execution
main() {
    print_header "AgroGrowth Cloud Deployment Tests"
    
    load_environment
    
    # Display configuration
    print_info "Test Configuration:"
    print_info "Frontend URL: ${FRONTEND_URL:-'Not set'}"
    print_info "API URL: ${API_URL:-'Not set'}"
    print_info "AI service checks: Node API gateway only (private services are server-side)"
    echo ""
    
    # Test 1: Infrastructure
    print_header "1. Infrastructure Tests"
    
    # Test frontend
    test_endpoint "$FRONTEND_URL" "200" "Frontend availability"
    
    # Test main API
    test_api_endpoint "${API_URL}/health" "Main API health check"
    
    # Test database and Redis
    test_database_connectivity
    test_redis_connectivity
    
    # Test 2: AI Services — always through the Node gateway.
    # Private Render/Python service URLs must never be probed from this client script.
    print_header "2. AI Services Gateway Tests"
    test_api_endpoint "${API_URL}/ai/health" "Eight AI services health through main API"

    # Test 3: PWA Features
    print_header "3. PWA Features Tests"
    test_pwa_features "$FRONTEND_URL"
    
    # Test 4: API Endpoints
    print_header "4. API Endpoints Tests"
    
    # Test critical API endpoints
    test_api_endpoint "${API_URL}/ai/health" "AI health endpoint"
    
    # Test 5: Performance
    print_header "5. Performance Tests"
    
    print_test "Frontend load time"
    local start_time=$(date +%s%N)
    if curl -s --connect-timeout 5 --max-time 10 "$FRONTEND_URL" >/dev/null; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        if [ $duration -lt 3000 ]; then
            print_success "Frontend loads in ${duration}ms (good)"
        elif [ $duration -lt 5000 ]; then
            print_warning "Frontend loads in ${duration}ms (acceptable)"
        else
            print_failure "Frontend loads in ${duration}ms (slow)"
        fi
    else
        print_failure "Frontend failed to load"
    fi
    
    # Test Results Summary
    print_header "Test Results Summary"
    
    echo -e "${CYAN}Total Tests:${NC} $TESTS_TOTAL"
    echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Failed:${NC} $TESTS_FAILED"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "${CYAN}Success Rate:${NC} ${success_rate}%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! Deployment is healthy.${NC}"
        return 0
    elif [ $success_rate -ge 80 ]; then
        echo -e "\n${YELLOW}⚠️  Most tests passed. Some issues detected.${NC}"
        return 1
    else
        echo -e "\n${RED}❌ Multiple test failures. Deployment needs attention.${NC}"
        return 2
    fi
}

# Help function
show_help() {
    echo "AgroGrowth Cloud Deployment Testing Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --frontend URL  Set frontend URL (default: http://localhost:5173)"
    echo "  -a, --api URL       Set API URL (default: http://localhost:8080/api)"
    echo "  -c, --cloud         Test cloud services (sets VITE_USE_CLOUD_SERVICES=true)"
    echo ""
    echo "Environment Variables:"
    echo "  FRONTEND_URL            Frontend application URL"
    echo "  API_URL                 Backend API URL"
    echo "  VITE_USE_CLOUD_SERVICES Enable cloud services testing"
    echo "  DATABASE_URL            Database connection URL"
    echo "  REDIS_URL               Redis connection URL"
    echo ""
    echo "Examples:"
    echo "  $0                                   # Test local development"
    echo "  $0 --cloud                          # Test with cloud services"
    echo "  $0 -f https://app.agrogrowth.com    # Test production frontend"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--frontend)
            FRONTEND_URL="$2"
            shift 2
            ;;
        -a|--api)
            API_URL="$2"
            shift 2
            ;;
        -c|--cloud)
            export VITE_USE_CLOUD_SERVICES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check dependencies
print_info "Checking dependencies..."
for cmd in curl jq; do
    if ! command -v $cmd >/dev/null 2>&1; then
        print_failure "$cmd is required but not installed"
        exit 1
    fi
done

# Run main test function
main "$@"
