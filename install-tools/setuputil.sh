# USE THIS TO INSTALL ALL OF NOVA'S DEPENDENCIES AND CLONE THE SOURCE GITHUB REPO CODE
# TO UPDATE NOVA RUN "rm -rf ~/NovaBotSource" THEN CONTINUE FROM LINE 17.
sudo apt update

if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi

if ! command -v curl &> /dev/null; then
    sudo apt install -y curl
fi

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Load NVM without restarting the shell.
. "$HOME/.nvm/nvm.sh"

# Install Node.js v22
nvm install 22

# Check installations
node -v
nvm current
npm -v

git clone https://github.com/Nirmini/NovaBot.git ~/NovaBot

cd ~/NovaBot

npm install

npm audit fix
