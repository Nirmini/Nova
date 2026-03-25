# TODO: Redo
cd ~
sudo apt update && sudo apt install -y git

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

. "$HOME/.nvm/nvm.sh"

nvm install 22

git clone git@github.com:Nirmini/MultiBotSource.git ~/NovaBotSource
cd ~/NovaBotSource
npm install
node --no-warnings src/deploy-cmds.js
node --no-warnings src/shard-monitor.js
cd ~

SERVICE_PATH="/etc/systemd/system/discord-bot.service"
USER="west701497"
NODE_VERSION="v22.14.0"
WORKING_DIR="/home/$USER/NovaBotSource"
NVM_DIR="/home/$USER/.nvm"

sudo bash -c "cat > $SERVICE_PATH" <<EOL
[Unit]
Description=Discord Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORKING_DIR
ExecStart=/bin/bash -c 'source $NVM_DIR/nvm.sh && $NVM_DIR/versions/node/$NODE_VERSION/bin/node --trace-warnings --inspect $WORKING_DIR/src/shard-monitor.js'
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl daemon-reload
sudo systemctl enable discord-bot
sudo systemctl restart discord-bot
