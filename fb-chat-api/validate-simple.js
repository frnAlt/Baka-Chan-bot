/**
 * Simple validation without dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating FCA Package for GoatBot-V2\n');
console.log('═'.repeat(60));

const checks = [
    { name: 'index.js', path: 'index.js' },
    { name: 'package.json', path: 'package.json' },
    { name: 'index.d.ts', path: 'index.d.ts' },
    { name: 'README.md', path: 'README.md' },
    { name: 'utils.js', path: 'utils.js' },
    { name: 'logger.js', path: 'logger.js' },
    { name: 'lib/Main.js', path: 'lib/Main.js' },
    { name: 'src directory', path: 'src' },
    { name: 'Language directory', path: 'Language' }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    if (fs.existsSync(check.path)) {
        console.log(`✅ ${check.name}`);
        passed++;
    } else {
        console.log(`❌ ${check.name}`);
        failed++;
    }
});

console.log('\n' + '═'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

// Check package.json content
try {
    const pkg = require('./package.json');
    console.log('\n📦 Package Information:');
    console.log(`   Name: ${pkg.name}`);
    console.log(`   Version: ${pkg.version}`);
    console.log(`   Main: ${pkg.main}`);
    console.log(`   Author: ${pkg.author}`);
} catch (e) {
    console.log('\n⚠️  Could not read package.json');
}

// Summary
console.log('\n' + '═'.repeat(60));
if (failed === 0) {
    console.log('✅ FCA PACKAGE IS READY FOR GOATBOT-V2!');
    console.log('═'.repeat(60));
    console.log('\nNext Steps:');
    console.log('1. Push to GitHub with your configured credentials');
    console.log('   Author: frnAlt <sultana01537118@gmail.com>');
    console.log('');
    console.log('2. Install in GoatBot-V2:');
    console.log('   npm install github:YOUR_USERNAME/REPO_NAME');
    console.log('');
    console.log('3. See SETUP_GUIDE.md for detailed instructions');
    console.log('');
    console.log('📖 Documentation:');
    console.log('   - README.md - Full documentation');
    console.log('   - SETUP_GUIDE.md - GitHub push guide');
    console.log('   - GOATBOT_INTEGRATION.md - Integration guide');
    console.log('   - example.js - Usage examples');
    console.log('');
} else {
    console.log('❌ VALIDATION FAILED');
    console.log('Some required files are missing.');
}
console.log('═'.repeat(60));
