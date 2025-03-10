# USE THIS TO INSTALL ALL OF NOVA'S DEPENDENCIES AND CLONE THE SOURCE GITHUB REPO CODE
# TO UPDATE NOVA RUN "Remove-Item -Recurse -Force %UserProfile%\Downloads\NovaBot" THEN CONTINUE FROM LINE 15.

$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    winget install --id Git.Git -e --source winget
}

$curlInstalled = Get-Command curl -ErrorAction SilentlyContinue
if (-not $curlInstalled) {
    winget install --id Curl.Curl -e --source winget
}

winget install Schniz.fnm

fnm install 22

node -v 
npm -v 

$repoPath = "%UserProfile%\Downloads\NovaBot"

if (-not (Test-Path -Path $repoPath)) {
    git clone https://github.com/Nirmini/NovaBot.git $repoPath
} else {
    Write-Host "Repository already exists at $repoPath. Skipping clone."
}

Set-Location -Path $repoPath

npm install

npm audit fix  # This is to play it safe. Only needed around half the time.
