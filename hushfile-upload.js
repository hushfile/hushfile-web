// function that handles reading file after it has been selected
function hfHandleFileSelect(evt) {
	// show upload page elements
	$('#fileselectdiv').hide();
	$('#read_progress_div, #encrypting, #uploading').css('display', 'block');

	// get file info and show it to the user
    file = evt.target.files[0];
	filename = file.name;
	if(file.type === 'undefined') {
		mimetype = "application/octet-stream";
	} else {
		mimetype = file.type;
	}
	filesize = file.size;
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
    $('#uploadbuttondiv').hide();

    var uploader = new HushFileUploader({
        onloadstart: function(e) {
            console.log("started uploading");
        }, 
        onprogress: function(e) {
            console.log("progress: " + e.loaded + '/' + e.total);
            temp = Math.round((e.loaded / e.total) * 100);
            $("#uploadprogressbar").css('width', temp + '%');
            $("#uploadprogressbar").text(temp + '%');
        },
        onload: function(e) {
            console.log("upload complete");
            $('#uploaddone').addClass("icon-check");
            $('#uploading').css('color', 'green');
            $('#response').show();
            //get current URL
            url = window.location.protocol + '//' + window.location.host + '/';

            document.getElementById('response').innerHTML = '<p><i class="icon-check"></i> <b><span style="color: green;">Success! Your URL is:</span></b><br> <a class="btn btn-success" href="/'+e.fileid+'#'+e.password+'">'+url+e.fileid+'#'+e.password+'</a>';
        }
    });
    uploader.upload(file);
};

function hfDoUpload() {
    console.log("do upload invoked");
    // hide upload button
    $('#uploadbuttondiv').hide();
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
                if (responseobject.status=='OK') {
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
};
