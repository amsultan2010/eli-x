#!/bin/bash
export PATH="/opt/homebrew/bin:/opt/homebrew/Cellar/node@22/22.22.2/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NODE_PATH="/opt/homebrew/lib/node_modules"
cd /Users/a.m.sultan/eli-x

# Create a local bin directory with node symlink so Turbopack child processes can find node
mkdir -p .local-bin
ln -sf /opt/homebrew/bin/node .local-bin/node
export PATH="$(pwd)/.local-bin:$PATH"

exec /opt/homebrew/bin/node node_modules/.bin/next dev
