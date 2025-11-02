/**
 * Example usage of FCA adapted for GoatBot-V2
 * 
 * This demonstrates how to use the adapted FCA in your GoatBot-V2 project
 */

const login = require('./index');
const fs = require('fs');

// Example 1: Login with appState (recommended)
function loginWithAppState() {
    console.log('=== Login with AppState ===');
    
    // Load appState from file
    let appState;
    try {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    } catch (err) {
        console.error('Error loading appstate.json:', err.message);
        console.log('Please create appstate.json with your Facebook cookies');
        return;
    }
    
    // Login with options
    const options = {
        selfListen: false,
        listenEvents: true,
        updatePresence: true,
        autoMarkDelivery: true,
        online: true
    };
    
    login({ appState }, options, (err, api) => {
        if (err) {
            console.error('Login failed:', err);
            return;
        }
        
        console.log('✅ Logged in successfully!');
        console.log('User ID:', api.getCurrentUserID());
        
        // Listen for messages
        api.listenMqtt((err, event) => {
            if (err) {
                console.error('Listen error:', err);
                return;
            }
            
            // Handle different event types
            switch (event.type) {
                case 'message':
                    console.log(`📨 Message from ${event.senderID}:`);
                    console.log(`   Thread: ${event.threadID}`);
                    console.log(`   Body: ${event.body}`);
                    
                    // Example: Echo command
                    if (event.body && event.body.startsWith('/echo ')) {
                        const text = event.body.substring(6);
                        api.sendMessage(`Echo: ${text}`, event.threadID, (err) => {
                            if (err) console.error('Send error:', err);
                        });
                    }
                    
                    // Example: Help command
                    if (event.body === '/help') {
                        api.sendMessage(
                            'Available commands:\n' +
                            '/help - Show this message\n' +
                            '/echo <text> - Echo back the text\n' +
                            '/ping - Test response',
                            event.threadID
                        );
                    }
                    
                    // Example: Ping command
                    if (event.body === '/ping') {
                        api.sendMessage('🏓 Pong!', event.threadID);
                    }
                    break;
                    
                case 'event':
                    console.log(`📅 Event in ${event.threadID}:`, event.logMessageType);
                    break;
                    
                case 'typ':
                    console.log(`⌨️  ${event.from} is typing...`);
                    break;
                    
                case 'read_receipt':
                    console.log(`👁️  ${event.reader} read the message`);
                    break;
            }
        });
        
        console.log('\n🤖 Bot is running...');
        console.log('Press Ctrl+C to stop\n');
    });
}

// Example 2: Using async/await (for modern code)
async function loginAsync() {
    console.log('=== Login with Async/Await ===');
    
    const { promisify } = require('util');
    const loginPromise = promisify(login);
    
    try {
        const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
        const api = await loginPromise({ appState });
        
        console.log('✅ Logged in successfully!');
        console.log('User ID:', api.getCurrentUserID());
        
        // Example: Send a message
        // await api.sendMessage('Hello from async/await!', 'THREAD_ID_HERE');
        
        return api;
    } catch (err) {
        console.error('Login failed:', err);
    }
}

// Example 3: Advanced - Using multiple API functions
function advancedExample() {
    login({ appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, async (err, api) => {
        if (err) return console.error(err);
        
        console.log('✅ Logged in!');
        
        // Get current user info
        const userId = api.getCurrentUserID();
        api.getUserInfo(userId, (err, info) => {
            if (!err) {
                console.log('Your info:', info[userId]);
            }
        });
        
        // Get friends list
        api.getFriendsList((err, friends) => {
            if (!err) {
                console.log(`You have ${friends.length} friends`);
            }
        });
        
        // Example: Advanced message handling
        api.listenMqtt(async (err, event) => {
            if (err) return;
            
            if (event.type === 'message' && event.body) {
                // Get thread info
                api.getThreadInfo(event.threadID, (err, threadInfo) => {
                    if (!err) {
                        console.log(`Message in: ${threadInfo.threadName || 'Unknown'}`);
                    }
                });
                
                // Get sender info
                api.getUserInfo(event.senderID, (err, userInfo) => {
                    if (!err) {
                        console.log(`From: ${userInfo[event.senderID].name}`);
                    }
                });
            }
        });
    });
}

// Run the example
if (require.main === module) {
    // Check if appstate.json exists
    if (!fs.existsSync('appstate.json')) {
        console.log('❌ appstate.json not found!');
        console.log('\nTo use this example:');
        console.log('1. Export your Facebook cookies as JSON');
        console.log('2. Save them to appstate.json in this directory');
        console.log('3. Run this example again');
        console.log('\nSee README.md for detailed instructions.');
        process.exit(1);
    }
    
    // Run the basic example
    loginWithAppState();
    
    // Uncomment to test async/await:
    // loginAsync();
    
    // Uncomment to test advanced features:
    // advancedExample();
}

module.exports = {
    loginWithAppState,
    loginAsync,
    advancedExample
};
