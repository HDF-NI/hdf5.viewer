import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import hdf5Routes from './routes/hdf5.js';

import H5 from 'hdf5ws/api/h5.js';
import H5Datasets from 'hdf5ws/api/h5datasets.js';
import H5Images from 'hdf5ws/api/h5images.js';
import H5Tables from 'hdf5ws/api/h5tables.js';
import { Access } from 'hdf5/lib/globals';

global.h5=new H5();
global.h5datasets=new H5Datasets(global.h5, 9001);
global.h5images=new H5Images(global.h5, 9001);
global.h5tables=new H5Tables(global.h5, 9001);

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors({ origin: '*' })); // Allows your future Vue dev-server to read this API
app.use(bodyParser());

// Capture launch parameters from command line (e.g., pnpm dev 8888 ./newone.h5)
global.port = process.argv[2] || 8888;
global.currentH5Path = process.argv[3] || './newone.h5';

console.log(`[HDF5 Target File]: ${global.currentH5Path}`);

// Mount our routes
app.use(hdf5Routes.routes()).use(hdf5Routes.allowedMethods());

// Add this route right near your other middleware / routers
app.use(async (ctx, next) => {
    if (ctx.originalUrl === "/api/node-clicked" && ctx.method === "POST") {
        // Capture the dynamic path parameters sent by Vue
        const { absolutePath, nodeType, name } = ctx.request.body;
        
        // Print the information straight into your backend server terminal!
        console.log(`\n[Tree Event Target Recieved]:`);
        console.log(`  📁 HDF5 Absolute Path: "${absolutePath}"`);
        console.log(`  🏷️  Node Name:        "${name}"`);
        console.log(`  ⚙️  Data Type:        "${nodeType}"`);
        
        if (nodeType === 'image') {
            console.log(`  ⚡ Initializing H5Images C++ WebSocket stream context for: ${absolutePath}`);
            
            // This triggers your legacy class method to bind the target node internally
            // and open the listening WebSocketServer on Port 9001!
            global.h5images.readImage(absolutePath);
        } else if (nodeType === 'dataset') {
            console.log(`  ⚡ Initializing H5Datasets C++ WebSocket stream context for: ${absolutePath}`);
            
            // This triggers your legacy class method to bind the target node internally
            // and open the listening WebSocketServer on Port 9001!
            global.h5datasets.readDataset(absolutePath);
        } else if (nodeType === 'table' && absolutePath.toLowerCase().endsWith(".csv")) {
            console.log(`  ⚡ Initializing csv H5Tables C++ WebSocket stream context for: ${absolutePath}`);
            global.h5tables.readCsv(absolutePath);
        } else if (nodeType === 'table') {
            console.log(`  ⚡ Initializing H5Tables C++ WebSocket stream context for: ${absolutePath}`);
            
            // This triggers your legacy class method to bind the target node internally
            // and open the listening WebSocketServer on Port 9001!
            global.h5tables.readTable(absolutePath);
        }

        ctx.status = 200;
        ctx.body = { status: 'success', received: absolutePath };
    } else {
        await next();
    }
});

// Fire up the native HTTP server
app.listen(global.port, () => {
  console.log(`🚀 Clean HDF5 JSON API running at http://localhost:${global.port}`);
});
