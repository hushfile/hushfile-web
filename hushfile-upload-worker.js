// function to read, encrypt and upload a given chunk
function hfUploadWorker() {
    self.addEventListener('message', function(e) {
        chunknumber = e.data.chunknumber;
        password = e.data.password;
        chunksize = e.data.chunksize;
        file = e.data.file;
        deletepassword = e.data.deletepassword;
        if(chunknumber==0) {
            //encrypt the metadata
            metadatajson = '{"filename": "' + file.name + '", "mimetype": "' + mimetype + '", "filesize": "' + file.size + '", "deletepassword": "' + deletepassword + '"}';
            metadataobject = CryptoJS.AES.encrypt(metadatajson, password);
        } else {
            fileid = e.data.fileid;
        };

        // prepare filereader
        var reader = new FileReader();

        // runs after chunk reading completes
        reader.onload = function(e) {        
            // add the data from this chunk to Uint8Array
            ui8a = new Uint8Array(reader.result);
            
            // create wordarray for cryptojs
            wordarray = CryptoJS.enc.u8array.parse(ui8a);
            
            // create the cryptoobject
            cryptoobject = CryptoJS.AES.encrypt(wordarray, password);

            var formData = new FormData();
            formData.append('fileid', fileid);
            formData.append('cryptofile', chunkdata);
            formData.append('chunknumber', chunknumber);
            formData.append('finishupload', false);
            if(chunknumber==0) {
                formData.append('metadata', metadataobject);
            } else {
                formData.append('uploadpassword', uploadpassword);
            };
            
            $.ajax({
                url: '/api/upload',
                type: 'POST',
                data: formData,
                dataType: 'json',
                contentType: false,
                processData: false,
                success: function(responseText) {
                    try{
                        responseobject = JSON.parse(responseText);
                        // return the response
                        if (responseobject.status=='ok') {
                            if(chunknumber==0) {
                                self.postMessage({
                                    'result': 'ok',
                                    'chunknumber': chunknumber,
                                    'fileid': responseobject.fileid,
                                    'uploadpassword': responseobject.uploadpassword
                                });
                            } else {
                                self.postMessage({
                                    'result': 'ok',
                                    'chunknumber': chunknumber
                                });
                            };
                        } else {
                            self.postMessage({
                                'result': 'failed', 
                                'chunknumber': chunknumber
                            });
                        };
                    } catch(err) {
                        $('#response').html('Something went wrong. Sorry about that. <a href="/">Try again.</a>');
                    }
                },
                error: function(err) {
                    $('#response').html('Something went wrong: ' + err);
                }
            });
        };

        // read a new chunk from disk
        if(chunksize > file.size) {
            // only one chunk
            slicestart = 0;
            sliceend = file.size;
        } else {
            slicestart = chunknumber * chunksize;
            sliceend = start + chunksize;
        };
        reader.readAsArrayBuffer(file.slice(slicestart,sliceend));
    }, false);
};
