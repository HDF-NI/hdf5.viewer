        var canvas = document.getElementById('photoplate');
        var context = canvas.getContext("2d");

            var hdf5Interface=new HDF5Interface(9001);
            hdf5Interface.requestImage(path, function(data){
                console.log(metaData);
                var imageData=context.createImageData(metaData.width, metaData.height);
                var pos=0;
                // Got new data
               var dv = new DataView(data);
                for(var i=0;i<data.byteLength;i+=metaData.planes)
                {
                        // set red, green, blue, and alpha:
                        imageData.data[pos++] =dv.getUint8(i);
                        imageData.data[pos++] = dv.getUint8(i+1);
                        imageData.data[pos++] = dv.getUint8(i+2);
                        (metaData.planes>3) ? imageData.data[pos++] =dv.getUint8(i+3) : imageData.data[pos++] = 255; // opaque alpha
                }
                 // Display new data in browser!
                context.putImageData(imageData, 0, 0);
        
            });

