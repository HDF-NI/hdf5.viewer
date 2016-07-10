var os = require("os");
var fs = require('fs');
var hdf5 = require('hdf5').hdf5;
var Koa = require('koa');
var route = require('koa-route');
var serve = require('koa-static');
const favicon = require('koa-favicon');
var MainView = require('views/MainView.js');
var H5Datasets = require('hdf5ws/api/h5datasets.js');
var H5Images = require('hdf5ws/api/h5images.js');
var H5Tables = require('hdf5ws/api/h5tables.js');

var Access = require('hdf5/lib/globals').Access;

var h5editors = require('lib/h5editors.js');
var h5modifiers = require('lib/h5modifiers.js');

global.port = process.argv[2];
global.currentH5Path = "";
global.h5datasets=new H5Datasets(9001);
global.h5images=new H5Images(9001);
global.h5tables=new H5Tables(9001);

if(process.argv.length>=4)global.currentH5Path =process.argv[3];
var app = new Koa();

app.use(favicon(__dirname + '/../public/favicon.ico'));

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
//app.use(route.post('/create_h5/:path', h5modifiers.createH5));
app.use(route.post('/create_node/:path', h5modifiers.create));
app.use(route.post('/rename_node/:path', h5modifiers.rename));
app.use(route.post('/copy_node/:path', h5modifiers.copy));
app.use(route.post('/move_node/:path', h5modifiers.move));
//app.use(route.post('/link_node/:path', h5modifiers.link));
app.use(route.post('/delete_node/:path', h5modifiers.deleteit));
app.use(route.post('/make_text/:path', h5modifiers.makeText));
app.use(route.post('/make_image/:path', h5modifiers.makeImage));
app.use(route.post('/make_dataset/:path', h5modifiers.makeDataset));
app.use(route.post('/make_table/:path', h5modifiers.makeTable));
//app.use(route.post('/modify_fields/:path', h5modifiers.modifyFields));


if(global.currentH5Path.length>0 && !fs.existsSync(global.currentH5Path)){
    var file = new hdf5.File(global.currentH5Path, Access.ACC_TRUNC);
    file.close();
}

app.listen(global.port, () => console.log('Server listening on', global.port));

