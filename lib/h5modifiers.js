var hdf5 = require('hdf5').hdf5;
var h5lt = require('hdf5').h5lt;
var h5tb = require('hdf5').h5tb;
var h5pt = require('hdf5').h5pt;

var co = require('co');
var H5Datasets = require('hdf5ws/api/h5datasets.js');
var H5Images = require('hdf5ws/api/h5images.js');

var Access = require('hdf5/lib/globals').Access;
var CreationOrder = require('hdf5/lib/globals').CreationOrder;
var State = require('hdf5/lib/globals').State;
var H5OType = require('hdf5/lib/globals').H5OType;
var HLType = require('hdf5/lib/globals').HLType;
var Interlace = require('hdf5/lib/globals').Interlace;
var StreamTable = require('lib/stream_table');
var BufferStream = require('lib/buffer_stream.js');

module.exports.create = function create(ctx, path) {
    if ('POST' != this.method) return next;
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    console.dir("currentH5Path "+global.currentH5Path);
    var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
    console.dir(stem+"/"+leaf);
    if(stem){
        console.dir("on group "+leaf);
        var newGroup=file.createGroup(stem+"/"+leaf);
        newGroup.flush();
        newGroup.close();
    }
    else{
        console.dir("on file "+leaf);
        var newGroup=file.createGroup(leaf);
        newGroup.flush();
        newGroup.close();
    }
    file.close();
    ctx.body = "";
    return;
};

module.exports.setCompression = function setCompression(ctx, path) {
    if ('POST' != ctx.method) return next;
        path=decodeURIComponent(path);
    global.h5.setCompression(path);
    ctx.body = "";
    return;
};

module.exports.rename = function rename(ctx, path) {
    if ('POST' != ctx.method) return next;
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    var rightBracketIndex=leaf.indexOf("[");
    var argument="";
    if(rightBracketIndex>0){
        argument=leaf.substring(rightBracketIndex+1, leaf.length-1);
        leaf=leaf.substring(0, rightBracketIndex);
    }
    try{
    var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
    if(stem){
    console.dir(leaf+" to "+argument+" on "+stem);
        var stemGroup=file.openGroup(stem);
        stemGroup.move(argument,  stemGroup.id, leaf);
        stemGroup.close();
    }
    else{
    console.dir(leaf+" to2 "+argument);
        file.move(argument, file.id, leaf);
    }
    file.close();
    }
    catch(err){
        console.dir(err.message);
    }
    ctx.body = "";
    return;
};

module.exports.move = function move(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to move");
    var squareIndex=path.lastIndexOf("[");
    if(squareIndex<0){ctx.body="";return;}
    var index=path.lastIndexOf("/", squareIndex);
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, squareIndex);
    }
    else
        leaf = path;
    var originalStem=path.substring(squareIndex+1, path.length-1);
    console.dir(stem);
    console.dir(leaf);
    console.dir(originalStem);
    
    try{
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
        if(stem && originalStem){
        console.dir(leaf+" to "+originalStem+" from "+stem);
            var stemGroup=file.openGroup(stem);
            var originalStemGroup=file.openGroup(originalStem);
            originalStemGroup.move(leaf,  stemGroup.id, leaf);
            stemGroup.close();
            originalStemGroup.close();
        }
        else if(originalStem){
        console.dir(leaf+" to2 "+originalStem);
            var originalStemGroup=file.openGroup(originalStem);
            originalStemGroup.move(leaf, file.id, leaf);
            originalStemGroup.close();
        }
        file.close();
    }
    catch(err){
        console.dir(err.message);
    }
    ctx.body = "";
    return;
};

module.exports.copy = function copy(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to copy");
    var squareIndex=path.lastIndexOf("[");
    if(squareIndex<0){ctx.body="";return;}
    var index=path.lastIndexOf("/", squareIndex);
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, squareIndex);
    }
    else
        leaf = path;
    var originalStem=path.substring(squareIndex+1, path.length-1);
    console.dir(stem);
    console.dir(leaf);
    console.dir(originalStem);
    
    try{
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
        if(stem && originalStem){
        console.dir(leaf+" to "+originalStem+" from "+stem);
            var stemGroup=file.openGroup(stem);
            var originalStemGroup=file.openGroup(originalStem);
            originalStemGroup.copy(leaf,  stemGroup.id, leaf);
            stemGroup.close();
            originalStemGroup.close();
        }
        else if(originalStem){
        console.dir(leaf+" to2 "+originalStem);
            var originalStemGroup=file.openGroup(originalStem);
            originalStemGroup.copy(leaf, file.id, leaf);
            originalStemGroup.close();
        }
        file.close();
    }
    catch(err){
        console.dir(err.message);
    }
        ctx.body = "";
        return;
};

module.exports.deleteit = function deleteit(ctx, path) {
    console.dir("deleteit "+ctx.method);
    if ('POST' != ctx.method) return next;
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
    console.dir("opened h5");
    if(stem){
        var group=file.openGroup(stem);
        group.delete(leaf);
        group.close();
    }
    else{
        file.delete(leaf);

    }
    file.close();
    ctx.body = "";
    return;
};

module.exports.makeImage = function makeImage(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to make image");
    //let h5images=new H5Images(9001);
    global.h5images.makeImage(path);
    ctx.body = "";
    return;
};

module.exports.makeText = function makeText(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to make text");
        path=decodeURIComponent(path);
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    global.h5datasets.makeText(path);
    ctx.body = "";
    return;
};

module.exports.makeDataset = function makeDataset(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to makedataset");
        path=decodeURIComponent(path);
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    global.h5datasets.makeDataset(path);
    ctx.body = "";
    return;
};

module.exports.makeTable = function makeTable(ctx, path) {
    if ('POST' != ctx.method) return next;
    console.dir("got to maketable");
        path=decodeURIComponent(path);
    var index=path.lastIndexOf("/");
    var stem = "";
    var leaf = "";
    if(index>=0)
    {
        stem=path.substring(0, index);
        leaf=path.substring(index+1, path.length);
    }
    else
        leaf = path;
    console.dir(stem);
    console.dir(leaf);
    global.h5tables.makeTable(path);
    ctx.body = "";
    return;
};
