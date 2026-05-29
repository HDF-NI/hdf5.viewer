import Router from '@koa/router';
import fs from 'fs';

// Force import of your working native C++ module link
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hdf5 = require('hdf5').hdf5;
var H5 = require('hdf5ws/api/h5.js');
var H5Datasets = require('hdf5ws/api/h5datasets.js');
var H5Images = require('hdf5ws/api/h5images.js');
var H5Tables = require('hdf5ws/api/h5tables.js');
const Access = require('hdf5/lib/globals').Access;

// Assume you have your adapted H5Tree layout class from your legacy workspace
const H5Tree = require('../../lib/h5tree.js'); // Point this to your local H5Tree script path

const router = new Router({ prefix: '/api' });

// 1. Endpoint to return the entire Navigation Tree Schema
router.get('/tree', async (ctx) => {
  try {
    const theTree = new H5Tree(global.currentH5Path);
    
    // Call your compiled native wrapper method asynchronously
    const h5Metadata = await theTree.loadH5Metadata(); 
    
    ctx.type = 'application/json';
    ctx.body = h5Metadata; // Koa natively handles JSON strings here automatically
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to extract HDF5 tree structure', details: error.message };
  }
});

// 2. Placeholder endpoint for when Vue requests a specific spreadsheet/table dataset on click
router.get('/dataset', async (ctx) => {
  const targetNodePath = ctx.query.path; // e.g., /Group1/MyTable
  
  // Here you will open the file and pull out ONLY the row dictionary arrays
  // ctx.body = extractedTableRows;
  ctx.body = { message: `Ready to extract data matrix from: ${targetNodePath}` };
});

// Endpoint to extract an image dataset node out of the HDF5 file binary matrix
// router.get('/image', async (ctx) => {
//   try {
//     const targetNodePath = ctx.query.path; // e.g., "/pmc/nightwatch.jpg"
    
//     // 1. Force the native global H5 library to read the requested image buffer context
//     // This calls your working compiled C++ wrapper bindings
//     const imageBuffer = global.h5images.readImageBuffer(global.currentH5Path, targetNodePath);
    
//     // 2. Set the HTTP response headers explicitly to tell the browser it is a JPEG image
//     ctx.type = 'image/jpeg';
    
//     // 3. Return the raw binary buffer directly. Koa natively converts Buffers to raw binary streams!
//     ctx.body = imageBuffer;
//   } catch (error) {
//     ctx.status = 500;
//     ctx.body = { error: 'Failed to extract HDF5 image element', details: error.message };
//   }
// });

export default router;
