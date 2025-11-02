# GoatBot-V2 Integration Guide

Complete guide for integrating this FCA with GoatBot-V2 by NTKhang03.

## Prerequisites

- Node.js 16+ installed
- GoatBot-V2 cloned or downloaded
- Facebook account appState (cookies)
- This FCA pushed to GitHub

## Step-by-Step Integration

### Step 1: Install This FCA in GoatBot-V2

Navigate to your GoatBot-V2 directory:

```bash
cd /path/to/Goat-Bot-V2
```

Install this adapted FCA:

```bash
# If you pushed to GitHub
npm install github:YOUR_USERNAME/fca-goatbot-v2

# Or using Porter-union-rom-updates
npm install github:Porter-union-rom-updates/fca-goatbot-v2

# Or for local development
npm install /path/to/adapted-fca
```

### Step 2: Configure GoatBot-V2 to Use This FCA

GoatBot-V2 typically uses the FCA in its login module. You need to update the FCA import.

#### Option A: Modify GoatBot-V2's Login File

Find GoatBot-V2's login file (usually in `bot/login/` or root directory):

**Before:**
```javascript
const login = require('fb-chat-api'); // or other FCA
```

**After:**
```javascript
const login = require('fca-goatbot-adapted');
```

#### Option B: Update package.json Dependencies

Edit GoatBot-V2's `package.json`:

```json
{
  "dependencies": {
    "fca-goatbot-adapted": "github:YOUR_USERNAME/fca-goatbot-v2"
  }
}
```

Remove old FCA if present:
```bash
npm uninstall fb-chat-api
npm install
```

### Step 3: Prepare Your AppState

Get your Facebook cookies (appState):

1. **Using Cookie Editor Extension**:
   - Install Cookie Editor for Chrome/Edge
   - Login to Facebook
   - Click extension → Export → JSON
   - Save as `account.txt` in GoatBot-V2 root

2. **Using c3c-fbstate**:
   - Install c3c-fbstate extension
   - Login to Facebook  
   - Export and save to `account.txt`

The `account.txt` should contain JSON array of cookies:
```json
[
  {
    "key": "c_user",
    "value": "YOUR_USER_ID",
    "domain": ".facebook.com",
    "path": "/",
    "expires": ...
  },
  ...
]
```

### Step 4: Configure GoatBot-V2

Edit `config.json` in GoatBot-V2:

```json
{
  "nickNameBot": "YourBotName",
  "prefix": "-",
  "language": "en",
  "adminBot": ["YOUR_FACEBOOK_ID"],
  "facebookAccount": {
    "email": "",
    "password": "",
    "intervalGetNewCookie": null
  }
}
```

**Note**: Leave email/password empty if using appState from `account.txt`.

### Step 5: Run GoatBot-V2

```bash
npm start
```

Or:
```bash
node index.js
```

You should see:
```
✅ Logged in successfully!
🤖 Bot is running...
```

## Verification

### Test 1: Login Success

When GoatBot starts, check for:
- ✅ "Logged in as [USER_ID]"
- ✅ No login errors
- ✅ Bot responds to commands

### Test 2: Send Test Message

Send a message in Messenger with your command prefix:
```
-help
```

Bot should respond with help menu.

### Test 3: Check Console

Monitor console for:
- ✅ No error messages
- ✅ MQTT connection established
- ✅ Events being received

## Common Integration Issues

### Issue 1: Module Not Found

**Error**: `Cannot find module 'fca-goatbot-adapted'`

**Solution**:
```bash
npm install github:YOUR_USERNAME/fca-goatbot-v2
```

### Issue 2: Login Failed

**Error**: `Login error` or `Invalid credentials`

**Solutions**:
- Get fresh appState cookies
- Check `account.txt` is valid JSON
- Try logging into Facebook with browser first
- Clear `fca-state.json` if exists

### Issue 3: MQTT Connection Failed

**Error**: `MQTT connection error`

**Solutions**:
- Check internet connection
- Your account might be checkpoint/blocked
- Try different network
- Wait and retry (temporary Facebook issues)

### Issue 4: "Old" FCA Still Loading

**Error**: GoatBot still uses old FCA

**Solutions**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

## Advanced Configuration

### Custom Options

You can modify FCA options in GoatBot-V2's login code:

```javascript
const login = require('fca-goatbot-adapted');

const fcaOptions = {
  selfListen: false,
  listenEvents: true,
  updatePresence: true,
  autoMarkDelivery: true,
  autoMarkRead: false,
  online: true,
  userAgent: "Mozilla/5.0..."
};

login({ appState }, fcaOptions, (err, api) => {
  // GoatBot initialization
});
```

### Multiple Accounts

To run multiple bots with different accounts:

1. Create separate GoatBot instances
2. Each with its own `account.txt`
3. Use different ports/processes

## Comparison with Other FCAs

| Feature | This FCA | fb-chat-api | Other FCAs |
|---------|----------|-------------|------------|
| GoatBot-V2 Compatible | ✅ Yes | ⚠️ Maybe | ❓ Varies |
| MQTT Support | ✅ Full | ✅ Full | ⚠️ Partial |
| TypeScript Defs | ✅ Included | ❌ No | ❓ Varies |
| Active Development | ✅ Yes | ❌ Archived | ❓ Varies |
| Clean API | ✅ Simple | ⚠️ Complex | ❓ Varies |

## Performance Tips

1. **Use AppState**: Faster than email/password login
2. **Optimize Options**: Disable features you don't use
3. **Monitor Memory**: Restart bot periodically if needed
4. **Keep Updated**: Pull latest FCA updates

## Updating the FCA

To update to latest version:

```bash
cd Goat-Bot-V2
npm update fca-goatbot-adapted

# Or force reinstall
npm uninstall fca-goatbot-adapted
npm install github:YOUR_USERNAME/fca-goatbot-v2
```

## Success Checklist

- [ ] FCA installed in GoatBot-V2
- [ ] GoatBot code updated to use FCA
- [ ] Valid appState in `account.txt`
- [ ] Bot starts without errors
- [ ] Bot responds to commands
- [ ] MQTT connection working
- [ ] No crashes or freezes

## Example: Full Integration

**File: `Goat-Bot-V2/bot/login/login.js`**

```javascript
const login = require('fca-goatbot-adapted');
const fs = require('fs');
const path = require('path');

module.exports = function(callback) {
  const appStatePath = path.join(__dirname, '../../account.txt');
  
  if (!fs.existsSync(appStatePath)) {
    return callback(new Error('account.txt not found'));
  }
  
  const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
  
  const options = {
    selfListen: false,
    listenEvents: true,
    updatePresence: true,
    autoMarkDelivery: true,
    online: true
  };
  
  login({ appState }, options, (err, api) => {
    if (err) return callback(err);
    
    console.log('✅ Logged in as:', api.getCurrentUserID());
    
    // Return API to GoatBot
    callback(null, api);
  });
};
```

## Getting Help

If you encounter issues:

1. **Check Documentation**: README.md, this file
2. **Verify Setup**: Follow checklist above
3. **Test FCA Separately**: Use example.js
4. **Check GoatBot-V2 Docs**: Issues might be GoatBot-related
5. **Review Console Logs**: Error messages are helpful

## Resources

- **GoatBot-V2**: https://github.com/ntkhang03/Goat-Bot-V2
- **This FCA**: Check your GitHub repository
- **Facebook Cookie Export**: Search for "Facebook cookie editor"

---

**You're now ready to run GoatBot-V2 with this adapted FCA!**
