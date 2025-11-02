# FCA Adapted for GoatBot-V2

A Facebook Chat API (FCA) fork adapted specifically for [GoatBot-V2](https://github.com/ntkhang03/Goat-Bot-V2) by NTKhang03.

Based on [fca-priyansh](https://github.com/priyanshufsdev/fca-priyansh) with modifications to ensure full compatibility with GoatBot-V2.

## Features

✅ **GoatBot-V2 Compatible** - Designed to work seamlessly with GoatBot-V2  
✅ **Clean API** - Simple, straightforward login function  
✅ **Promise Support** - Modern async/await compatible  
✅ **TypeScript Definitions** - Full TypeScript support included  
✅ **MQTT Support** - Full MQTT messaging support  
✅ **Stable** - Based on battle-tested fca-priyansh  

## Installation

### From GitHub (Recommended)

```bash
npm install github:Porter-union-rom-updates/Fca#adapted
```

### Local Installation

```bash
cd /path/to/this/directory
npm install
npm link
```

Then in your GoatBot-V2 project:

```bash
npm link fca-goatbot-adapted
```

## Usage with GoatBot-V2

### Basic Example

```javascript
const login = require('fca-goatbot-adapted');
const fs = require('fs');

// Login with appState (recommended)
login(
  { appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) },
  (err, api) => {
    if (err) return console.error(err);
    
    console.log('Logged in successfully!');
    
    // Listen for messages
    api.listenMqtt((err, event) => {
      if (err) return console.error(err);
      
      if (event.type === 'message') {
        console.log(`Message from ${event.senderID}: ${event.body}`);
        
        // Echo the message back
        api.sendMessage(`You said: ${event.body}`, event.threadID);
      }
    });
  }
);
```

### With Options

```javascript
const login = require('fca-goatbot-adapted');

const options = {
  selfListen: false,
  listenEvents: true,
  updatePresence: true,
  autoMarkDelivery: true,
  online: true
};

login({ appState: [...] }, options, (err, api) => {
  if (err) return console.error(err);
  // Your code here
});
```

### Async/Await Style

```javascript
const login = require('fca-goatbot-adapted');
const { promisify } = require('util');

const loginAsync = promisify(login);

(async () => {
  try {
    const api = await loginAsync({ appState: [...] });
    console.log('Logged in!');
    
    // Use the API
    await api.sendMessage('Hello!', threadID);
  } catch (err) {
    console.error('Login failed:', err);
  }
})();
```

## Getting AppState

You need Facebook cookies in JSON format (appState) to login.

### Method 1: Using Cookie Editor (Recommended)

1. Install [Cookie Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) extension
2. Go to [facebook.com](https://facebook.com) and login
3. Click the Cookie Editor extension icon
4. Click "Export" → "Export as JSON"
5. Save the JSON to `appstate.json`

### Method 2: Using c3c-fbstate

1. Install [c3c-fbstate](https://github.com/c3cbot/c3c-fbstate) extension
2. Go to Facebook and login
3. Click the extension to export appstate
4. Save to `appstate.json`

## API Reference

### Main Functions

#### `sendMessage(message, threadID, [callback])`
Send a message to a thread.

```javascript
api.sendMessage('Hello!', threadID, (err, messageInfo) => {
  if (!err) console.log('Message sent!');
});
```

#### `listenMqtt(callback)`
Listen for new messages and events via MQTT.

```javascript
api.listenMqtt((err, event) => {
  if (err) return console.error(err);
  console.log(event);
});
```

#### `getUserInfo(userID, callback)`
Get information about a user.

```javascript
api.getUserInfo(userID, (err, info) => {
  if (!err) console.log(info);
});
```

#### `getThreadInfo(threadID, callback)`
Get information about a thread/group.

```javascript
api.getThreadInfo(threadID, (err, info) => {
  if (!err) console.log(info);
});
```

### More Functions

- `editMessage(text, messageID, callback)` - Edit a sent message
- `unsendMessage(messageID, callback)` - Unsend a message
- `setMessageReaction(reaction, messageID, callback)` - React to a message
- `changeNickname(nickname, threadID, userID, callback)` - Change nickname
- `changeThreadColor(color, threadID, callback)` - Change thread color
- `changeThreadEmoji(emoji, threadID, callback)` - Change thread emoji
- `createNewGroup(userIDs, name, callback)` - Create a group
- `addUserToGroup(userID, threadID, callback)` - Add user to group
- `removeUserFromGroup(userID, threadID, callback)` - Remove user from group
- `getAppState()` - Get current appState (cookies)
- `getCurrentUserID()` - Get logged in user ID

See TypeScript definitions (`index.d.ts`) for complete API reference.

## Configuration

The FCA will create a `fca-config.json` file on first run with default settings:

```json
{
  "Language": "en",
  "AutoUpdate": false,
  "MainColor": "#9900FF",
  "MainName": "[ FCA-GOATBOT ]",
  "Config": "default",
  "DevMode": false
}
```

## Integration with GoatBot-V2

### Step 1: Clone GoatBot-V2

```bash
git clone https://github.com/ntkhang03/Goat-Bot-V2
cd Goat-Bot-V2
```

### Step 2: Install this FCA

```bash
npm install github:Porter-union-rom-updates/Fca#adapted
```

### Step 3: Update GoatBot-V2 to use this FCA

In GoatBot-V2's login file (usually `bot/login/login.js` or similar), replace the FCA import:

```javascript
// Change from:
// const login = require('fb-chat-api');

// To:
const login = require('fca-goatbot-adapted');
```

### Step 4: Add your appstate.json

Place your Facebook cookies in `account.txt` or configure as per GoatBot-V2 documentation.

### Step 5: Run GoatBot-V2

```bash
npm start
```

## Differences from Original FCA

This adapted version includes:

- ✅ Clean, simple exports compatible with GoatBot-V2
- ✅ Removed unnecessary global configuration complexity
- ✅ Simplified initialization process  
- ✅ Better error handling
- ✅ TypeScript definitions included
- ✅ Modern Promise/async-await support
- ✅ Optimized for GoatBot-V2 usage patterns

## Troubleshooting

### Login Failed / Invalid Credentials

- Make sure your `appstate.json` is valid and up to date
- Try logging into Facebook with a browser first
- Export fresh cookies

### "Module not found"

```bash
npm install
```

### MQTT Connection Issues

- Check your internet connection
- Facebook might be blocking your IP - try using a different network
- Your appState might be expired - get fresh cookies

## Credits

- **Original FCA**: [fca-priyansh](https://github.com/priyanshufsdev/fca-priyansh) by Priyansh Rajput
- **GoatBot-V2**: [NTKhang03](https://github.com/ntkhang03/Goat-Bot-V2)
- **Reference FCAs**: 
  - [ws3-fca](https://github.com/tas33n/ws3-fca)
  - [nexus-fca](https://github.com/tas33n/nexus-fca)

## License

MIT License - See LICENSE file for details

## Support

For issues specific to:
- **This FCA adapter**: Open an issue on this repository
- **GoatBot-V2**: Visit [GoatBot-V2 repository](https://github.com/ntkhang03/Goat-Bot-V2)
- **Facebook API changes**: These are beyond our control

## Disclaimer

This is an unofficial API. Use at your own risk. Facebook may block accounts using unofficial APIs.

**Recommendations:**
- Use a secondary Facebook account
- Don't spam or abuse the API
- Follow Facebook's Terms of Service
- Use responsibly
