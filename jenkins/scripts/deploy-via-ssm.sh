#!/usr/bin/env bash
# Sends a local script to a private EC2 instance via AWS SSM Run Command
# (no SSH/bastion needed) and blocks until it finishes, failing the build
# if the remote script fails.
set -euo pipefail

INSTANCE_ID="$1"
SCRIPT_FILE="$2"
IMAGE_REF="$3"
REGION="${4:-ap-south-1}"

SCRIPT_B64=$(base64 -w0 "$SCRIPT_FILE")

COMMAND_ID=$(aws ssm send-command \
  --region "$REGION" \
  --document-name "AWS-RunShellScript" \
  --targets "Key=InstanceIds,Values=$INSTANCE_ID" \
  --parameters "commands=[\"echo $SCRIPT_B64 | base64 -d > /tmp/deploy.sh\",\"chmod +x /tmp/deploy.sh\",\"/tmp/deploy.sh '$IMAGE_REF'\"]" \
  --query "Command.CommandId" --output text)

echo "SSM command $COMMAND_ID sent to $INSTANCE_ID, waiting for completion..."

for _ in $(seq 1 30); do
  STATUS=$(aws ssm get-command-invocation \
    --region "$REGION" \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query "Status" --output text 2>/dev/null || echo "Pending")

  echo "status: $STATUS"

  case "$STATUS" in
    Success)
      exit 0
      ;;
    Failed|Cancelled|TimedOut)
      echo "--- stdout ---"
      aws ssm get-command-invocation --region "$REGION" --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query "StandardOutputContent" --output text || true
      echo "--- stderr ---"
      aws ssm get-command-invocation --region "$REGION" --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query "StandardErrorContent" --output text || true
      exit 1
      ;;
  esac

  sleep 10
done

echo "Timed out waiting for SSM command $COMMAND_ID"
exit 1
