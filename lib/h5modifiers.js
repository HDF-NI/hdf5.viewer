var hdf5 = require('hdf5').hdf5;
var h5im = require('hdf5').h5im;
var h5lt = require('hdf5').h5lt;
var h5tb = require('hdf5').h5tb;
var h5pt = require('hdf5').h5pt;

var co = require('co');
var BinaryServer = require('binaryjs').BinaryServer;

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
        var server = BinaryServer({port: 9001, path: '/binary-store-image'});
        server.on('error',function (error ) {console.dir(error);});
        // Wait for new user connections
        server.on('connection', function(client){
          // Incoming stream from browsers
          console.dir("connected");
          client.on('stream', function(stream, meta){
          console.dir("streaming");
          try{
            var buffers = [];
            stream.on('data', function(buffer) {
          console.dir("streaming data");
              buffers.push(buffer);
            });
            stream.on('end', function() {
          console.dir("streaming end "+global.currentH5Path);
                var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
          console.dir("open "+stem);
                var group=file.openGroup(stem);
          console.dir("buffer concat");
                var image = Buffer.concat(buffers);
                image.interlace=Interlace.INTERLACE_PIXEL;
                image.planes=4;
                image.width=meta.width;
                image.height=meta.height;
                console.dir(meta.name+" "+meta.width);
          console.dir("buffer concat");
                try{
                h5im.makeImage(group.id, meta.name, image);
                }
                catch(err){
                    console.dir(err.message);
                }
                group.close();
                file.close();
                server.close();
            });
        }catch(err){
            console.dir(err);
        }
          });
        });
        ctx.body = "";
        return;
};

module.exports.makeText = function makeText(ctx, path) {
    console.dir("check post text");
    if ('POST' != ctx.method) return next;
    console.dir("got to make text");
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
        var server = BinaryServer({port: 9001, path: '/binary-store-text'});
        // Wait for new user connections
        server.on('connection', function(client){
          // Incoming stream from browsers
          console.dir("connected");
          client.on('stream', function(stream, meta){
          console.dir("streaming");
          try{
            var buffers = [];
            stream.on('data', function(buffer) {
              if(Buffer.isBuffer(buffer))buffers.push(buffer);
              else buffers.push(new Buffer(buffer));
            });
            stream.on('end', function() {
          console.dir("streaming end "+global.currentH5Path);
                var file = new hdf5.File(global.currentH5Path, Access.ACC_RDWR);
          console.dir("open "+stem);
                var group=file.openGroup(stem);
          console.dir("buffer concat "+buffers.length);
                var tableData = Buffer.concat(buffers);
                try{
                    h5lt.makeDataset(group.id, meta.name, tableData.toString());
                }
                catch(err){
                    console.dir(err.message);
                }
                group.close();
                file.close();
                server.close();
            });
        }catch(err){
            console.dir(err);
        }
          });
        });
        ctx.body = "";
        return;
};

