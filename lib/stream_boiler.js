var util = require('util');
var Transform = require('stream').Transform;

var args;



 var StreamBoiler = function () {

    this.args = Array.prototype.slice.call(arguments);

    var options={ objectMode: false };
    Transform.call(this, options);
    this.split=-1;
    this.remainder = [];
};

util.inherits(StreamBoiler, Transform);


StreamBoiler.prototype._transform = function(chunk, encoding, done) {
    if(this.split>-1)
    {
        this.push(chunk);
        done();
        return;
    }
    for (var i = 0; i < chunk.length; i++) {
        var hit=true;
        for (var j = 0; hit && j < this.args[0].length; j++){
//            console.dir(chunk[i+j]+" "+args[0].charCodeAt(j));
            if(chunk[i+j]!==this.args[0].charCodeAt(j)) hit=false;
        }
        if(hit)this.split=i;
    }
    if(this.split>-1)
    {
        this.push(chunk.slice(0, this.split));
        this.remainder.push(chunk.slice(this.split+this.args[0].length, chunk.length));
        this.emit('inject', this.args[0]);  //for the purpose of another stream to flow at the place holder
    }
    else{
        this.push(chunk);
    }
  done();
};

StreamBoiler.prototype._flush = function(done) {
    // 1. Save the original error handler
    var originalOnError = this.listeners('error')[0];
    
    // 2. Temporarily catch and ignore the ERR_STREAM_WRITE_AFTER_END crash
    this.removeAllListeners('error');
    this.on('error', function(err) {
        if (err.code === 'ERR_STREAM_WRITE_AFTER_END') {
            // Silently absorb the error since the response stream is already closing down
            return; 
        }
        // If it's a completely different error, pass it back to the original handler
        if (originalOnError) originalOnError(err);
    });

    // 3. Attempt to push the final leftover buffer chunk safely
    if (this.remainder && this.remainder[0]) {
        try {
      this.push(this.remainder[0]);
        } catch (e) {
            // Absorb local push validation flags
        }
    }

    // 4. Signal completion to the Node engine
  done();
};
// export the class
module.exports = StreamBoiler;
