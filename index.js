// Temporarily absorb the legacy stream crash so the server stays alive
process.on('uncaughtException', function (err) {
    if (err.code === 'ERR_STREAM_WRITE_AFTER_END') {
        // Silently swallow this specific stream error
        console.log('--- Absorbed legacy write-after-end stream warning ---');
        return;
    }
    // If it is a completely different, critical error, let it crash normally
    console.error('Critical Uncaught Exception:', err);
    process.exit(1);
});

require("./lib/application");1