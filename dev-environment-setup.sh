#!/bin/bash

# Government Workflow Platform - Development Environment Automated Setup

# Color Codes for Enhanced Readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging Function
log_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Detect Operating System
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
    elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32"* ]]; then
        OS="Windows"
    else
        log_error "Unsupported operating system"
        exit 1
    fi
    echo "$OS"
}

# Prerequisite Installation Functions
install_homebrew() {
    if ! command -v brew &> /dev/null; then
        log_warning "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        log_status "Homebrew already installed"
    fi
}

install_chocolatey() {
    if ! command -v choco &> /dev/null; then
        log_warning "Chocolatey not found. Installing Chocolatey..."
        powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    else
        log_status "Chocolatey already installed"
    fi
}

install_node() {
    local version="16.20.0"
    
    case "$OS" in
        "macOS")
            brew install node@$version
            ;;
        "Linux")
            # Use NVM for flexible Node.js management
            if ! command -v nvm &> /dev/null; then
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                source ~/.bashrc
            fi
            nvm install $version
            nvm use $version
            ;;
        "Windows")
            choco install nodejs-lts --version=$version
            ;;
    esac
    
    log_status "Node.js $version installed"
}

install_docker() {
    case "$OS" in
        "macOS")
            brew install --cask docker
            ;;
        "Linux")
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose
            sudo usermod -aG docker $USER
            ;;
        "Windows")
            choco install docker-desktop
            ;;
    esac
    
    log_status "Docker installed"
}

install_postman() {
    case "$OS" in
        "macOS")
            brew install --cask postman
            ;;
        "Linux")
            sudo snap install postman
            ;;
        "Windows")
            choco install postman
            ;;
    esac
    
    log_status "Postman installed"
}

setup_project_environment() {
    # Clone Repository (replace with actual repository URL)
    git clone https://github.com/your-org/government-workflow-platform.git
    
    cd government-workflow-platform
    
    # Install Project Dependencies
    npm install
    
    # Create Environment Configuration
    cp .env.example .env
    
    # Generate Sample Test Dataset
    npm run generate:test-dataset
    
    log_status "Project environment setup complete"
}

configure_git_hooks() {
    # Setup pre-commit hooks for linting and testing
    npm install husky --save-dev
    npx husky install
    npx husky add .husky/pre-commit "npm run lint && npm run test"
    
    log_status "Git hooks configured for code quality"
}

main() {
    clear
    echo "🚀 Government Workflow Platform - Development Environment Setup"
    echo "-----------------------------------------------------------"
    
    # Detect Operating System
    OS=$(detect_os)
    log_status "Detected OS: $OS"
    
    # Install Package Managers
    case "$OS" in
        "macOS")
            install_homebrew
            ;;
        "Windows")
            install_chocolatey
            ;;
    esac
    
    # Install Prerequisites
    install_node
    install_docker
    install_postman
    
    # Project Setup
    setup_project_environment
    configure_git_hooks
    
    echo -e "\n${GREEN}✨ Development Environment Setup Complete! ✨${NC}"
    echo "Next steps:"
    echo "1. Review .env configuration"
    echo "2. Run 'npm run dev' to start development server"
}

# Execute Main Setup Function
main
