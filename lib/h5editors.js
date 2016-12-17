var hdf5 = require('hdf5').hdf5;
var h5im = require('hdf5').h5im;
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
var H5ZType = require('hdf5/lib/globals').H5ZType;

var StreamTable = require('lib/stream_table');
var BufferStream = require('lib/buffer_stream.js');

var requireDir = require('require-dir');
var datasetAddons = requireDir("../addons/dataset");
var tableAddons = requireDir("../addons/table");
var textAddons = requireDir("../addons/text");

module.exports.datasetEditor = function (ctx, path) {
    if ('GET' != ctx.method) return next;
    path=decodeURIComponent(path);
    //console.dir("load editor"+path);
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
    if(stem && leaf){
        //console.dir(stem+" on to h5 "+leaf);
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDONLY);
        var parent=file.openGroup(stem);
            const filters = parent.getFilters(leaf);
            console.dir(filters.isAvailable(H5ZType.H5Z_FILTER_DEFLATE));
            console.dir(filters.isAvailable(H5ZType.H5Z_FILTER_DEFLATE));
            console.dir(filters.getNFilters());
        
        var document=h5lt.readDataset(parent.id, leaf);
        if(Object.prototype.toString.call(document)==="[object ArrayBuffer]")
        {
            switch(document.rank)
            {
                case 3:
                var sections="";
                var csvDoc="";
                console.dir("sec "+document.sections+" "+document.rows+" "+document.columns);
                ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><form>";
//                        for(var k=0;k<document.sections;k++)
                {
                var streamTable=new StreamTable(document.rows, document.columns);
                ctx.body+=streamTable;
//            streamTable.resume();
                for(var i=0;i<document.rows*document.columns;i++)
                {
                    //console.dir(document[i]);
                        streamTable.write(document[i]);
                }
//                        var table ="<table>\n";
//                        for(var i=0;i<document.rows;i++)
//                        {
//                            table +="<tr>";
//                            var columns=document.columns;
//                            for(var j=0;j<columns;j++)
//                            {
//                                table +="<td>"+document[document.rows*document.columns*k+columns*i+j]+"</td>";
//                                csvDoc+=document[document.rows*document.columns*k+columns*i+j];
//                                if(j<columns-1)csvDoc+=",";
//                            }
//                            table +="</tr>\n";
//                            csvDoc+="\n";
//                        }
//                        table +="</table>\n";
//                        sections+=table;
                }
//                        sections
                ctx.body+="</form></div>";
                /*unirest.post('http://localhost:8000/_/example2')
                .headers({ 'Content-Type': 'text/csv' })
                .send(csvDoc)
                .end(function (response) {
                  console.log(response.body);
                });*/
                break
                case 2:
                case 1:
                var table ="<table>\n";
                var csvDoc="";
                for(var i=0;i<document.rows;i++)
                {
                    table +="<tr>";
                    var columns=1;
                    if(document.rank==2)columns=document.columns;
                    for(var j=0;j<columns;j++)
                    {
                        table +="<td>"+document[columns*i+j]+"</td>";
                        csvDoc+=document[columns*i+j];
                        if(j<columns-1)csvDoc+=",";
                    }
                    table +="</tr>\n";
                    csvDoc+="\n";
                }
                table +="</table>\n";
                ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><form>"+table+"</form></div>";
//                unirest.post('http://localhost:8000/_/example2')
//                .headers({ 'Content-Type': 'text/csv' })
//                .send(csvDoc)
//                .end(function (response) {
//                  console.log(response.body);
//                });
                break;
            default:
            break;
            }
        }
//                else if(document instanceof Int32Array)
//                {
//                    
//                }
        else
        {
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><form><textarea type=\"text\" name=\"username\" id=\"h5-text\" draggable=\"true\">"+document+"</textarea></form></div>";
        }
        parent.close();
        file.close();

    }
    else ctx.body = "";
};


module.exports.imageEditor = function imageEditor(ctx, path) {
    if ('GET' != ctx.method) return next;
    //console.dir("load editor"+path);
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
    if(stem && leaf){
    console.dir(stem);
    console.dir(leaf);
        co(function*(){
    var p =  new Promise((resolve, reject) => {
    global.h5images.read("/read_image/"+stem+"/"+leaf, function(metaData){
    console.log('resolve')
        resolve(metaData);
    });
    });
    
    p.then(metaData => {
    console.log('success!'+JSON.stringify(metaData))
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><canvas id=\"photoplate\" draggable=\"true\" width=\""+metaData.width+"\" height=\""+metaData.height+"\"><script type=\"text/javascript\" src=\"js/photoplate.js\"></script></canvas></div>";
    }).catch(error => {
        console.log('rejection '+error);
    });
});

    }
    else ctx.body = "";
};

module.exports.tableEditor = function tableEditor(ctx, path) {
    if ('GET' != ctx.method) return next;
    path=decodeURIComponent(path);
    console.dir("load table editor"+path);
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
    if(stem && leaf){
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDONLY);
        var parent=file.openGroup(stem);
        var columnTable=h5tb.readTable(parent.id, leaf);
        var table ="<table id=\"h5-table\" draggable=\"true\">\n";
//        var csvDoc="";
        table +="<thead><tr>";
        for (var columnIndex=0;columnIndex<columnTable.length;columnIndex++) {
                table +="<th>"+columnTable[columnIndex].name+"</th>";

        }
        table +="</tr></thead><tbody>";
        for(var rowIndex=0;rowIndex<columnTable[0].length;rowIndex++)
        {
            table +="<tr>";
            for (var columnIndex=0;columnIndex<columnTable.length;columnIndex++) {
                table +="<td>"+columnTable[columnIndex][rowIndex]+"</td>";
//                csvDoc+=columnTable[columnIndex][rowIndex];
//                if(columnIndex<columnTable.length-1)csvDoc+=",";
            }
            table +="</tr>\n";
//            csvDoc+="\n";
        }
        table +="</tbody></table>\n";
        if(Object.keys(tableAddons).length>0){
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\">" +
                    "<article class=\"tabs\">	<section id=\"tab1\">" +
                    "<h2><a href=\"#tab1\">Table</a></h2><div id=\"editor-table\"><form>"+table+"</form></div></section>";
            var singleView=false;
            var viewIndex=2;
            for (var addon in tableAddons){
        console.dir("addon "+addon);
                var te= tableAddons[ addon ].load(leaf, columnTable);
                if(te.multiview){
                    ctx.body +="<section id=\"tab"+viewIndex+"\">" +
                    "<h2><a href=\"#tab"+viewIndex+"\">"+te.title+"</a></h2>"+te.body+"</section>";
                    viewIndex++;
                }
                else{
                    ctx.body=te.body;
                    singleView=true;
                    break;
                }
            }
            if(!singleView)ctx.body +="</article></div>";
        }
        else{
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\">" +
                    "<div id=\"editor-table\"><form>"+table+"</form></div></section>";

        }
        parent.close();
        file.close();

    }
    else ctx.body = "";
};

module.exports.packetsEditor = function packetsEditor(ctx, path) {
    if ('GET' != ctx.method) return next;
    path=decodeURIComponent(path);
    //console.dir("load editor"+path);
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
    if(stem && leaf){
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDONLY);
        var parent=file.openGroup(stem);
        var packetTable=h5pt.readTable(parent.id, leaf);
            var table ="<table draggable=\"true\">\n";
            var csvDoc="";
                table +="<tr>";
                for (var name in packetTable.record) {
                    table +="<th>"+name+"</th>";
                }
                table +="</tr>";
                while(packetTable.next()){
                table +="<tr>";
                var columns=Object.keys(packetTable.record).length;
                var j=0;
                for (var name in packetTable.record) {
                    table +="<td>"+packetTable.record[name]+"</td>";
                    csvDoc+=packetTable.record[name];
                    if(j<columns-1)csvDoc+=",";
                    j++;
                }
                table +="</tr>\n";
                csvDoc+="\n";
            }
            packetTable.close();
            table +="</table>\n";
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><form>"+table+"</form></div>";
    //                            unirest.post('http://localhost:8000/_/example2')
    //                            .headers({ 'Content-Type': 'text/csv' })
    //                            .send(csvDoc)
    //                            .end(function (response) {
    ////                              console.log(response.body);
    //                            });
        parent.close();
        file.close();

    }
    else ctx.body = "";
};

module.exports.textEditor = function textEditor(ctx, path) {
    if ('GET' != ctx.method) return next;
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
    if(stem && leaf){
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDONLY);
        var parent=file.openGroup(stem);
        var document=h5lt.readDataset(parent.id, leaf);
        if(Object.keys(textAddons).length>0){
            for (var addon in textAddons){
                ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\">" +
                        "<article class=\"tabs\">	<section id=\"tab1\">" +
                        "<h2><a href=\"#tab1\">Text</a></h2><div id=\"editor-text\"><form><textarea type=\"text\" name=\"username\" id=\"h5-text\" draggable=\"true\">"+document+"</textarea></form></div></section>"
            var singleView=false;
            var viewIndex=2;
                var te= textAddons[ addon ].load(leaf, document);
                if(leaf.endsWith(te.extension)){
                if(te.multiview){
                            ctx.body += "<section id=\"tab"+viewIndex+"\">" +
                            "<h2><a href=\"#tab"+viewIndex+"\">"+te.title+"</a></h2>"+te.body+"</section></article></div>";
                }
                else{
                    ctx.body=te.body;
                    singleView=true;
                    break;
                }
                }
                if(!singleView)ctx.body +="</article></div>";
            }
        }
        else{
            ctx.body = "<div id=\"editor\" dropzone=\"copy file:image/png file:image/gif file:image/jpeg file:text/csv\" ondragstart=\"dragStartHandler(event, this)\" ondrag=\"dragHandler(event, this)\" ondragend=\"dragEndHandler(event, this)\" ondrop=\"dropHandler(event, this)\"><form><textarea type=\"text\" name=\"username\" id=\"h5-text\" draggable=\"true\">"+document+"</textarea></form></div>";

        }
        parent.close();
        file.close();

    }
    else ctx.body = "";
};

module.exports.attributesEditor = function attributesEditor(ctx, path) {
    if ('GET' != ctx.method) return next;
    path=decodeURIComponent(path);
    //console.dir("load editor"+path);
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
    var attrText="";
    if(stem && leaf){
        var file = new hdf5.File(global.currentH5Path, Access.ACC_RDONLY);
        var parent=file.openGroup(stem);
        var childType = parent.getChildType(leaf);
        switch (childType)
        {
            case H5OType.H5O_TYPE_GROUP:
                var child=parent.openGroup(leaf);
                child.refresh();
                Object.getOwnPropertyNames(child).forEach(function(val, idx, array) {
                    if(val!="id")attrText+=val+" :  "+child[val]+"\n";
                });
                child.close();
                break;
            case H5OType.H5O_TYPE_DATASET:
                var attrs=parent.getDatasetAttributes(leaf);
                Object.getOwnPropertyNames(attrs).forEach(function(val, idx, array) {
                    if(val!="id"){
                        if(attrs[val].constructor.name===Array){
                            attrText+=val+" :  ";
                            for(var mIndex=0;mIndex<attrs[val].Length();mIndex++){
                                attrText+=attrs[val][mIndex];
                                if(mIndex<attrs[val].Length()-1)attrText+=",";
                            }
                        }
                        else{
                            attrText+=val+" :  "+attrs[val]+"\n";
                        }
                    }
                });
                break;
        }
        parent.close();
        file.close();
    }
    ctx.body = attrText;
};


