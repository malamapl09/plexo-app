#!/bin/bash
set -euo pipefail

# Verify swap exists
if ! swapon --show | grep -q /swapfile; then
  echo "Setting up 1GB swap..."
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Kernel tuning
cat <<'SYSCTL' | sudo tee /etc/sysctl.d/99-plexo.conf
fs.file-max = 65535
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.core.netdev_max_backlog = 4096
vm.overcommit_memory = 1
vm.swappiness = 10
SYSCTL
sudo sysctl -p /etc/sysctl.d/99-plexo.conf

# File descriptor limits
cat <<'LIMITS' | sudo tee /etc/security/limits.d/99-plexo.conf
* soft nofile 65535
* hard nofile 65535
LIMITS

# Limit journald disk usage
sudo mkdir -p /etc/systemd/journald.conf.d
cat <<'JOURNAL' | sudo tee /etc/systemd/journald.conf.d/99-plexo.conf
[Journal]
SystemMaxUse=100M
SystemKeepFree=200M
JOURNAL
sudo systemctl restart systemd-journald

echo "EC2 tuning complete. Reboot recommended for limits.conf to take effect."
