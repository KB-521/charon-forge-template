#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
command -v mvn >/dev/null 2>&1 || { echo 'Maven 3.6.3+ is required.' >&2; exit 2; }
maven_info=$(mvn --version 2>&1)
case "$maven_info" in
  *"Java version: 1.8."*|*"Java version: 8."*) ;;
  *) echo 'Maven must run on JDK 8. Set JAVA_HOME to a JDK 8 installation.' >&2; exit 2 ;;
esac
exec mvn --batch-mode --no-transfer-progress verify "$@"
