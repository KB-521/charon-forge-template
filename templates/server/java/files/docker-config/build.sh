#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
entry=${1:-web}
case "$entry" in web|server) ;; *) echo 'Usage: build.sh [web|server] [image]' >&2; exit 2 ;; esac
module="__PROJECT_NAME__-$entry"
image=${2:-__PROJECT_NAME__-$entry:local}
mvn --batch-mode --no-transfer-progress -pl "$module" -am package
docker build -f docker-config/Dockerfile --build-arg "MODULE=$module" --build-arg "GIT_COMMIT_ID=${GIT_COMMIT_ID:-unknown}" -t "$image" .
# Build only. Image publication and deployment are explicit user operations.
