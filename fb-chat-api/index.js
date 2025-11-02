'use strict';

/**
 * FCA Adapted for GoatBot-V2
 * Based on fca-priyansh with modifications for GoatBot-V2 compatibility
 * 
 * This adapter provides a clean, simple login interface compatible with
 * GoatBot-V2 by NTKhang03
 */

const utils = require('./utils');
const log = require('npmlog');

// Global FCA object for configuration and state
global.Fca = {
    isThread: [],
    isUser: [],
    startTime: Date.now(),
    Setting: new Map(),
    Version: '2.0.0-goatbot',
    Require: {
        fs: require("fs"),
        Fetch: require('got'),
        log: require("npmlog"),
        utils: require("./utils.js"),
        logger: require('./logger.js'),
        languageFile: require('./Language/index.json'),
        Security: {
            create: function() {
                const crypto = require('crypto');
                return {
                    apiKey: crypto.randomBytes(16).toString('hex')
                };
            },
            encrypt: require('./Extra/Security/Base'),
            decrypt: require('./Extra/Security/Base')
        }
    },
    getText: function(...Data) {
        let Main = (Data.splice(0,1)).toString();
        for (let i = 0; i < Data.length; i++) {
            Main = Main.replace(RegExp(`%${i + 1}`, 'g'), Data[i]);
        }
        return Main;
    },
    Data: {
        ObjFca: {
            "Language": "en",
            "AutoUpdate": false,
            "MainColor": "#9900FF",
            "MainName": "[ FCA-GOATBOT ]",
            "Config": "default",
            "DevMode": false,
            "Login2Fa": false,
            "AutoLogin": false,
            "EncryptFeature": false,
            "ResetDataLogin": false
        }
    }
};

// Initialize configuration
try {
    const fs = global.Fca.Require.fs;
    const configPath = process.cwd() + '/fca-config.json';
    
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(global.Fca.Data.ObjFca, null, "\t"));
    }
    
    try {
        const Data_Setting = require(configPath);
        global.Fca.Require.FastConfig = Object.assign({}, global.Fca.Data.ObjFca, Data_Setting);
    } catch (e) {
        global.Fca.Require.FastConfig = global.Fca.Data.ObjFca;
    }
    
    // Set Priyansh config (for backward compatibility)
    global.Fca.Require.Priyansh = Object.assign({}, global.Fca.Require.FastConfig, {
        AntiGetInfo: {
            Database_Type: "default"
        }
    });
    
    // Set language
    const languageFile = global.Fca.Require.languageFile;
    if (languageFile.some(i => i.Language == global.Fca.Require.FastConfig.Language)) {
        global.Fca.Require.Language = languageFile.find(i => i.Language == global.Fca.Require.FastConfig.Language).Folder;
    } else {
        global.Fca.Require.Language = languageFile.find(i => i.Language == 'en').Folder;
    }
} catch (e) {
    console.error('Config initialization error:', e);
    global.Fca.Require.FastConfig = global.Fca.Data.ObjFca;
    global.Fca.Require.Priyansh = global.Fca.Data.ObjFca;
}

// Load the main login module
let mainLogin;
try {
    mainLogin = require('./lib/Main');
} catch (e) {
    console.error('Failed to load Main module:', e);
    throw e;
}

/**
 * Login function compatible with GoatBot-V2
 * @param {Object} credentials - Login credentials (appState, email, password)
 * @param {Object} options - Login options
 * @param {Function} callback - Callback function (err, api)
 */
function login(credentials, options, callback) {
    // Handle optional options parameter
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    
    // Default options for GoatBot-V2 compatibility
    const defaultOptions = {
        selfListen: false,
        listenEvents: true,
        listenTyping: false,
        updatePresence: true,
        forceLogin: false,
        autoMarkDelivery: true,
        autoMarkRead: false,
        autoReconnect: true,
        online: true,
        emitReady: false,
        userAgent: "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36"
    };
    
    // Merge options
    const finalOptions = Object.assign({}, defaultOptions, options);
    
    // Validate credentials
    if (!credentials) {
        return callback(new Error('Credentials are required'));
    }
    
    // Call the main login function
    try {
        return mainLogin(credentials, finalOptions, callback);
    } catch (e) {
        console.error('Login error:', e);
        if (callback) callback(e);
    }
}

// Export the login function for GoatBot-V2
module.exports = login;
module.exports.login = login;

// Also export utils for advanced users
module.exports.utils = utils;
module.exports.logger = require('./logger');
