# Nova Setup Guide
---
## Prerequisites
- Node.js 22.0.0 or later
- NPM 10.0.0 or later
- Visual Studio Code (Other IDEs may be used, but VSC is recommended.)
---
# 1. Setting up Firebase Admin SDK
### To use Firebase services in Nova, you'll need a **Service Account JSON file**. This file is required for authentication when making secure requests to Firebase.

## Getting the Firebase Service Account Key
### Follow these steps to obtain your Firebase Admin SDK service account key:

1. **Go to the Firebase Console**  
   - Open [Firebase Console](https://console.firebase.google.com/).
   - Select your project.

2. **Navigate to Project Settings**  
   - In the left-hand menu, click the ⚙️ **Settings** icon.
   - Go to the **Service accounts** tab.

3. **Generate a New Private Key**  
   - Under the **Firebase Admin SDK** section, click **"Generate new private key"**.
   - A JSON file will be downloaded to your computer.

4. **Move the JSON File to Nova's Directory**  
   - Place the downloaded `.json` file in the `./keys/` folder of Nova.  
   - Rename it to `serviceAccountKey.json` for consistency.

5. **Set the Environment Variable**  
   - Open your `.env` file and add the following line:
     ```ini
     GOOGLE_APPLICATION_CREDENTIALS=./keys/serviceAccountKey.json
     ```

6. **Verify the Setup**  
   - Run the following command in your terminal to check if Firebase Admin is configured correctly:
     ```powershell
     node -e "console.log(require('firebase-admin').apps.length ? 'Firebase Admin SDK Loaded' : 'Failed to Load')"
     ```
   - If everything is set up properly, it should output:  
     ```
     Firebase Admin SDK Loaded
     ```

## Additional Notes
- **DO NOT** share your `serviceAccountKey.json` file publicly.
- **DO NOT** commit this file to Git. Add it to `.gitignore`:
  ```gitignore
  keys/serviceAccountKey.json
  ```
  - If you lose the key, revoke the old one and generate a new one from Firebase Console.
---
##### Last updated: `7/3/25`
###### Written by `@thatWest7014`