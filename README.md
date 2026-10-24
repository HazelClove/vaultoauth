# VaultOAuth

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefoxbrowser&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

TOTP authenticator that lives in your browser no internet required.

Reads QR codes straight off your screen by screenshotting the tab and cropping it. Pulls logos for 100+ sites automatically. Codes are generated locally and stored in `storage.local`

## Heads up!!

Using one `manifest.json` for both browsers means Chrome will show a yellow warning about `background.scripts` in `chrome://extensions`. It's harmless. The extension works fine ^_^

## How to setup

### Chrome

1. Go to `chrome://extensions`
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/4c4be989-7342-4bf3-be18-ab45811d693a" />

2. Enable Developer Mode
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/642752fe-4e21-4b1e-a762-73890b22062e" />

3. Press 'Load Unpacked'
<br><img width="300" alt="image" src="https://github.com/user-attachments/assets/f581e93a-f5aa-4462-a8ab-98518327e4d4" />

4. Pack the files you downloaded into a folder and select it
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/0e488f52-1ff5-43f6-b736-7e341b58d6ca" />

5. Done! Enjoy.

### Firefox

1. Visit `about:debugging`
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/5b143b4f-b11e-47de-a166-13a415e8b0bd" />

2. Select "This Firefox"
<br><img width="300" alt="image" src="https://github.com/user-attachments/assets/bbd0387e-71d3-42cc-bb9b-2957c31627dc" />

3. Press "Load Temporary Addon"
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/a847c773-ba95-4b7a-bea9-16031526a61f" />

4. Select the `manifest.json` inside the folder you made (must be in the folder with the other files!)
<br><img width="600" alt="image" src="https://github.com/user-attachments/assets/9e3f9945-e1e8-46b6-8cc7-cf61d6eb7107" />

5. Done. Enjoy!
