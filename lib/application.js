var os = require("os");
var net = require('net')
var http = require('http')
var https = require('https')
var url = require('url')
var fs = require('fs');
var hdf5 = require('hdf5').hdf5;
var Koa = require('koa');
var route = require('koa-route');
var serve = require('koa-static');
const favicon = require('koa-favicon');
var compress = require('koa-compress');
const cors = require('@koa/cors');
const shutdown = require('koa-graceful-shutdown');

var MainView = require('views/MainView.js');
var H5 = require('hdf5ws/api/h5.js');
var H5Datasets = require('hdf5ws/api/h5datasets.js');
var H5Images = require('hdf5ws/api/h5images.js');
var H5Tables = require('hdf5ws/api/h5tables.js');

var Access = require('hdf5/lib/globals').Access;

var h5editors = require('lib/h5editors.js');
var h5modifiers = require('lib/h5modifiers.js');

global.port = process.argv[2];
global.currentH5Path = "";
if(process.argv.length>=4)global.currentH5Path =process.argv[3];
global.h5=new H5();
global.h5datasets=new H5Datasets(global.h5, 9001);
global.h5images=new H5Images(global.h5, 9001);
global.h5tables=new H5Tables(global.h5, 9001);

var app = new Koa();

app.use(favicon(__dirname + '/../public/favicon.ico'));
var options = {
    origin: '*'
};
app.use(cors(options));

var H5Tree = require('lib/h5tree.js');

console.dir(__dirname + '/../public');
app.use(serve(__dirname + '/../public'));
app.use(serve(__dirname + '/../addons/dataset'));
app.use(serve(__dirname + '/../addons/image'));
app.use(serve(__dirname + '/../addons/packets'));
app.use(serve(__dirname + '/../addons/table'));
app.use(serve(__dirname + '/../addons/text'));
app.use(serve(__dirname + '/../node_modules/hdf5ws/lib'));
//app.use(serve('ethercalc'));
//app.use(serve('node_modules/ethercalc'));

app.use((ctx, next) => {
    if (ctx.originalUrl==="/") {
        ctx.type = 'html';
        console.dir(global.currentH5Path);
        ctx.body=new MainView(ctx, global.currentH5Path);
    }
    else return next();
});

app.use(route.get('/dataset_h5editors/:path', h5editors.datasetEditor));
app.use(route.get('/image_h5editors/:path', h5editors.imageEditor));
app.use(route.get('/table_h5editors/:path', h5editors.tableEditor));
app.use(route.get('/packets_h5editors/:path', h5editors.packetsEditor));
app.use(route.get('/text_h5editors/:path', h5editors.textEditor));
app.use(route.get('/attributes_h5editors/:path', h5editors.attributesEditor));
app.use(route.post('/set_compression/:path', h5modifiers.setCompression));
//app.use(route.post('/create_h5/:path', h5modifiers.createH5));
app.use(route.post('/create_node/:path', h5modifiers.create));
app.use(route.post('/rename_node/:path', h5modifiers.rename));
app.use(route.post('/copy_node/:path', h5modifiers.copy));
app.use(route.post('/move_node/:path', h5modifiers.move));
//app.use(route.post('/link_node/:path', h5modifiers.link));
app.use(route.post('/delete_node/:path', h5modifiers.deleteit));
app.use(route.post('/make_text/:path', h5modifiers.makeText));
app.use(route.post('/make_table/:path', h5modifiers.makeTable));
//app.use(route.post('/modify_fields/:path', h5modifiers.modifyFields));


if(global.currentH5Path.length>0 && !fs.existsSync(global.currentH5Path)){
    var file = new hdf5.File(global.currentH5Path, Access.ACC_TRUNC);
    file.close();
}

const theServer = https.createServer({
      key: fs.readFileSync('../scad.key'),
      cert: fs.readFileSync('../scad.cert')
  }, app.callback());

app.use(shutdown(theServer));

  theServer.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  console.log("pathname "+pathname);
  if (pathname.startsWith("/make_dataset/")) {
    global.h5datasets.make.handleUpgrade(request, socket, head, function done(ws) {
      global.h5datasets.make.emit('connection', ws, request);
    });
  } if (pathname.startsWith("/read_dataset/")) {
    global.h5datasets.read.handleUpgrade(request, socket, head, function done(ws) {
      global.h5datasets.read.emit('connection', ws, request);
    });
  } else if (pathname.startsWith("/make_image/")) {
    global.h5images.make.handleUpgrade(request, socket, head, function done(ws) {
      global.h5images.make.emit('connection', ws, request);
    });
  } else if (pathname.startsWith("/read_image/")) {
    global.h5images.read.handleUpgrade(request, socket, head, function done(ws) {
      global.h5images.read.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

theServer.listen(global.port, function listening() {
  console.log('Listening on %d', global.port);
});
