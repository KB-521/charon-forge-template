#!/bin/sh
set -eu
deployment=${1:?Usage: check-jobs.sh deployment [namespace]}
namespace=${2:-default}
exec kubectl --namespace "$namespace" rollout status "deployment/$deployment" --timeout=180s
