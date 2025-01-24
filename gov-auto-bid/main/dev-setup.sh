#!/bin/bash

# Government Workflow Platform - Development Environment Setup Script
# Supports: macOS, Linux, Windows (via WSL2)

set -e  # Exit immediately if a command exits with a non-zero status

# Color Output Formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'  # No Color

# Detect Operating System
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS='macOS';;
        Linux*)    OS='Linux';;
        MINGW*)    OS='Windows';;
        *)         OS='Unknown';;
    esac
}

# Prerequisite Checking Function
check_prerequisites() {
    local missing_deps=()

    # Check core dependencies
    command -v git >/dev/null 2>&1 || missing_deps+=("git")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing_deps[*]}${NC}"
        install_core_dependencies
    fi
}

# Core Dependency Installation
install_core_dependencies() {
    echo -e "${YELLOW}Installing core dependencies...${NC}"
    
    case "$OS" in
        macOS)
            # Check for Homebrew, install if not present
            if ! command -v brew >/dev/null 2>&1; then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install git curl
            ;;
        Linux)
            # Detect Linux distribution
            if [ -f /etc/debian_version ]; then
                sudo apt-get update
                sudo apt-get install -y git curl
            elif [ -f /etc/redhat-release ]; then
                sudo yum install -y git curl
            fi
            ;;
        Windows)
            # Assume WSL2 is installed, use appropriate package manager
            sudo apt-get update
            sudo apt-get install -y git curl
            ;;
        *)
            echo -e "${RED}Unsupported operating system${NC}"
            exit 1
            ;;
    esac
}

# Node.js and Development Tools Installation
install_dev_tools() {
    echo -e "${YELLOW}Installing Node.js and development tools...${NC}"

    # Use Node Version Manager (nvm) for flexible Node.js management
    if ! command -v nvm >/dev/null 2>&1; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        
        # Source nvm for current session
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    # Install latest LTS Node.js version
    nvm install --lts
    nvm use --lts

    # Global development tool installation
    npm install -g yarn jest cypress postman-cli docker-compose
}

# Docker and Containerization Setup
install_docker() {
    echo -e "${YELLOW}Installing Docker...${NC}"
    
    case "$OS" in
        macOS)
            brew install docker docker-compose
            ;;
        Linux)
            if [ -f /etc/debian_version ]; then
                curl -fsSL https://get.docker.com -o get-docker.sh
                sudo sh get-docker.sh
                sudo usermod -aG docker $USER
            elif [ -f /etc/redhat-release ]; then
                sudo yum install -y docker docker-compose
                sudo systemctl start docker
            fi
            ;;
        Windows)
            # Assumes Docker Desktop for Windows with WSL2 backend is installed
            echo -e "${GREEN}Please ensure Docker Desktop is installed and configured with WSL2 backend${NC}"
            ;;
    esac
}

# Project Repository Cloning
clone_project_repository() {
    echo -e "${YELLOW}Cloning Government Workflow Platform Repository...${NC}"
    
    # Replace with actual repository URL
    git clone https://github.com/your-org/government-workflow-platform.git
    cd government-workflow-platform

    # Initialize submodules if any
    git submodule update --init --recursive
}

# Environment Configuration
setup_environment() {
    echo -e "${YELLOW}Configuring development environment...${NC}"
    
    # Copy environment template
    cp .env.example .env

    # Install project dependencies
    yarn install
}

# Main Execution
main() {
    detect_os
    check_prerequisites
    install_dev_tools
    install_docker
    clone_project_repository
    setup_environment

    echo -e "${GREEN}Development environment setup complete!${NC}"
    echo -e "${YELLOW}Next steps: yarn test:comprehensive${NC}"
}

# Run the script
main
