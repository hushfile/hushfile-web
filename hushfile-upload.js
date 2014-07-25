// function that handles reading file after it has been selected
function hfHandleFileSelect(evt) {
	// show upload page elements
	$('#fileselectdiv').hide();
	$('#read_progress_div, #encrypting, #uploading').css('display', 'block');
	

	// get file info and show it to the user
	filename = evt.target.files[0].name;
	if(evt.target.files[0].type === 'undefined') {
		mimetype = "application/octet-stream";
	} else {
		mimetype = evt.target.files[0].type;
	}
	filesize = evt.target.files[0].size;
	$('#filename').html(filename);
	$('#mimetype').html(mimetype);
	$('#filesize').html(filesize);
	$('#file_info_div').css('display', 'block');
    
    // get chunksize, divide the chunksize by 1.5 to allow for encryption overhead 
    chunksize = Math.floor(hfGetChunkSize() / 1.5);
    
    // find the number of chunks needed
    chunkcount = Math.ceil(filesize / chunksize);
    
    $('#chunkcount').html(chunkcount);
    $('#chunksdone').html(0);
    $('#uploadbuttondiv').show();

};

function hfDoUpload() {
    // hide upload button
    $('#uploadbuttondiv').hide();
    
	//generate deletepassword
	deletepassword = hfRandomPassword(40);
	
	//encrypt the metadata
	metadatajson = '{"filename": "'+filename+'", "mimetype": "'+mimetype+'", "filesize": "'+filesize+'", "deletepassword": "' + deletepassword + '"}'
	metadataobject = CryptoJS.AES.encrypt(metadatajson, $('#password').val());

    // max. number of workers
    maxworkers = 5;
    
    // initialize vars
    fileid = false;
    chunkindex = 0;    
    chunkstate = [];
    for (chunkindex=0; chunkindex < chunkcount; chunkindex++) {
        chunkstate[chunkindex] = 'pending';
    };
    
    // spawn worker to process the first chunk (and get the fileid)
    worker = new Worker('hushfile-upload-worker.js');

    // add listener for when the worker is done
    worker.addEventListener('message', function(e) {
        if(e.data.result=='ok') {
            // get the data from the workers response
            if(e.data.chunknumber) {
                // mark this chunk as done
                chunkstate[e.data.chunknumber] = 'done';
                
                // this was the first chunk so the fileid and uploadpassword is returned after upload
                fileid = e.data.fileid;
                uploadpassword = e.data.uploadpassword;
                
                // any remaining chunks ?
                if(chunkcount > 1) {
                    // TODO spawn workers to handle remaining chunks
                } else {
                    // only one chunk, finish the upload
                    hfFinishUpload();
            } else {
                chunkstate[e.data.chunknumber] = 'failed';
            };                
        };
        
        // terminate the worker
        worker.terminate(); 
    }, false);

    worker.postMessage({
        'chunknumber': 0, 
        'password': document.getElementById('password').value, 
        'chunksize': chunksize, 
        'file': evt.target.files[0],
        'metadata': metadataobject
    });
};

function hfFinishUpload() {
    $.ajax({
        url: '/api/finishupload',
        type: 'POST',
        data: formData,
        dataType: 'json',
        contentType: false,
        processData: false,
        success: function(responseText) {
            try{
                responseobject = JSON.parse(responseText);
                // if everything went well, show the download link
                if (responseobject.status=='ok') {
                    hfUploadCompletion();
                } else {
                    $('#response').html('Something went wrong. Sorry about that. <a href="/">Try again.</a>');
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


function hfGetChunkSize() {
    // check if the default chunksize from client config 
    // is larger than the servers maximum chunksize
    if (config.default_chunksize_bytes > serverinfo.max_chunksize_bytes) {
        // clients default_chunksize_bytes is larger 
        // than servers max_chunksize_bytes, so use the servers max_chunksize_bytes
        // as the chunksize instead
        return serverinfo.max_chunksize_bytes;
    } else {
        // just use the clients default_chunksize_bytes
        return config.default_chunksize_bytes;
    }
};


//function invoked after upload, displaying the url
function hfUploadCompletion() {
	// Ensure that the load_progress bar displays 100% at the end.
	hfUpdateProgressAbsolute('#uploadprogressbar', 1, 1);
	$('#read_progress_div').css('color','green');
	
	//make the next section visible
	hfCheckStep('#uploaddone', '#uploading');

	//get current URL
	basepath = window.location.protocol + '//' + window.location.host + '/';
	url = basepath+fileid+'#'+$('#password').val();

	$('#response')
		.show()
		.html('<p><i class="icon-check"></i> <b><span style="color: green;">Success! Your URL is:</span></b><br/><input type="text" id="url-textfield" class="span8 search-query" value="'+url+'"/>&nbsp;<a class="btn btn-success" href="'+url+'">Go to url</a>');
	$('#url-textfield').select()
}
