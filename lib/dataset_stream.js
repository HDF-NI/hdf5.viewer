var util = require('util');
var Writable = require('stream').Writable;

var args;
var rows;
var columns;
var i;
var j;


 var DatasetStream = function (rows, columns) {
     this.rows=rows;
     this.columns=columns;
     this.i=0;
     this.j=0;

    var options={ objectMode: true };
    Writable.call(this, options);
};

util.inherits(DatasetStream, Writable);


DatasetStream.prototype._write(chunk, encoding, callback) {
        this.push(chunk);

  callback();
};

DatasetStream.prototype._flush = function(done) {
  //this.push("</tr>\n</table>\n");
  done();
};
// export the class
module.exports = DatasetStream;
