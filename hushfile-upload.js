// function that handles reading file after it has been selected
function hfHandleFileSelect(evt) {
	// show upload page elements
	$('#uploadbuttondiv').hide();
	$('#read_progress_div, #encrypting, #uploading').css('display', 'block');
	
	//create filereader object
	reader = new FileReader();
	
	//register event handlers
	reader.onprogress = hfUpdateProgressComputable('#filereadpercentbar');

	// runs after file reading completes
	reader.onload = function(e) {
		// Ensure that the load_progress bar displays 100% at the end.
		hfUpdateProgressAbsolute('#filereadpercentbar', 1, 1);
		$('#readingdone').removeClass('icon-check-empty').addClass('icon-check');
		$('#read_progress_div').css('color', 'green');

		//make the next section visible
		$('#encrypting').css('display', 'block');
		$('#encryptingdone').addClass('icon-spinner icon-spin');
		setTimeout('hfEncrypt()',1000);
	};

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
	
	// begin reading the file
	reader.readAsArrayBuffer(evt.target.files[0]);
};


// function that encrypts the file,
// and creates and encrypts metadata
function hfEncrypt() {
	//encrypt the data
	ui8a = new Uint8Array(reader.result);
	wordarray = CryptoJS.enc.u8array.parse(ui8a);
	cryptoobject = CryptoJS.AES.encrypt(wordarray, document.getElementById('password').value);

	//generate deletepassword
	deletepassword = hfRandomPassword(40);
	
	//encrypt the metadata
	metadatajson = '{"filename": "'+filename+'", "mimetype": "'+mimetype+'", "filesize": "'+filesize+'", "deletepassword": "' + deletepassword + '"}'
	metadataobject = CryptoJS.AES.encrypt(metadatajson, $('#password').val());

	//done encrypting
	hfCheckStep('#encryptingdone', '#encrypting');

	//make the next section visible
	$('#uploaddone').addClass('icon-spinner icon-spin');
	$('#uploading').css('display','block'); //this needs to be here for the progressbar to show status

	setTimeout('hfUpload(cryptoobject,metadataobject,deletepassword, 1024)',1000);
}


//function to update progressbar with self defined values
function hfUpdateProgressAbsolute(target, current, total) {
	var temp = Math.round(current / total * 100);
	$(target).width(temp + '%');
	$(target).text(temp + '%');
}


//function to update progressbar with file
function hfUpdateProgressComputable(target) {
	return function(evt){
		// evt is an ProgressEvent.
		if (evt.lengthComputable) {
			var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
			// Increase the load_progress bar length.
			$(target).width(percentLoaded + '%');
			$(target).text(percentLoaded + '%');
		}
	}
}


//DRY
function hfCheckStep(checkbox, label) {
	$(checkbox).removeClass('icon-spinner icon-spin icon-check-empty').addClass('icon-check');
	$(label).css('color', 'green');
}


//function invoked after upload, displaying the url
function hfUploadCompletion(responseobject) {
	// Ensure that the load_progress bar displays 100% at the end.
	hfUpdateProgressAbsolute('#uploadprogressbar', 1, 1);
	$('#read_progress_div').css('color','green');
	
	//make the next section visible
	hfCheckStep('#uploaddone', '#uploading');

	//get current URL
	basepath = window.location.protocol + '//' + window.location.host + '/';
	url = basepath+responseobject.fileid+'#'+$('#password').val();

	$('#response').html('<p><i class="icon-check"></i> <b><span style="color: green;">Success! Your URL is:</span></b><br/><input type="text" id="url-textfield" class="span8 search-query" value="'+url+'"/>&nbsp;<a class="btn btn-success" href="'+url+'">Go to url</a>');
	$('#url-textfield').select()
}


//function to upload the remaining chunks
function hfUploadChunk(fileid, cryptoobject, uploadpassword, chunksize, start, completion) {
	var end = start + chunksize;
	var chunkdata = cryptoobject.toString().substring(start, end);
	var chunknumber = start/chunksize; //this should give an integer ;)
	var totalchunks = Math.ceil(cryptoobject.toString().length/chunksize);
	var last = cryptoobject.toString().length < end;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/api/upload', true);
	xhr.onload = function(e) {
		//parse json reply
		try {
			var responseobject = JSON.parse(xhr.responseText);
			if (responseobject.status=='ok') {
				if(responseobject.finished) {
					completion(responseobject);	
				} else {
					hfUpdateProgressAbsolute('#uploadprogressbar', chunknumber+1, totalchunks);
					hfUploadChunk(fileid, cryptoobject, uploadpassword, chunksize, end, completion);
				}
			} else {
				$('#response').html('Something went wrong. Sorry about that. <a href="/">Try again.</a>');
			}
		} catch(err) {
			$('#response').html('Something went wrong: ' + err);
		};
	};

	var formData = new FormData();
	formData.append('fileid', fileid);
	formData.append('cryptofile', chunkdata);
	formData.append('uploadpassword', uploadpassword);
	formData.append('chunknumber', chunknumber);
	formData.append('finishupload', last);
	xhr.send(formData);	
}


//function to upload the first chunk and metadata
function hfUpload(cryptoobject, metadataobject, deletepassword, chunksize) {
	chunksize = chunksize*1000; //transform to MB
	var chunkdata = cryptoobject.toString().substring(0, chunksize);
	var shortcircuit = cryptoobject.toString().length < chunksize;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/api/upload', true);
	xhr.onload = function(e) {
		//parse json reply
		try {
			var responseobject = JSON.parse(xhr.responseText);
			if (responseobject.status=='ok') {
				if(responseobject.finished){
					hfUploadCompletion(responseobject);
				} else {
					hfUpdateProgressAbsolute('#uploadprogressbar', 1, Math.max(1, Math.ceil(cryptoobject.toString().length/chunksize)));
					hfUploadChunk(responseobject.fileid, cryptoobject, responseobject.uploadpassword, chunksize, chunksize, hfUploadCompletion);
				}
			} else {
				$('#response').html('Something went wrong. Sorry about that. <a href="/">Try again.</a>');
			}
		} catch(err) {
			$('#response').html('Something went wrong: ' + err);
		};
	};
	
	if(shortcircuit) xhr.onprogress = hfUpdateProgressComputable('#uploadprogressbar');

	var formData = new FormData();
	formData.append('cryptofile', chunkdata);
	formData.append('metadata', metadataobject);
	formData.append('deletepassword', deletepassword);
	formData.append('chunknumber', 0);
	formData.append('finishupload', shortcircuit);
	xhr.send(formData);	
}


// return a random password of the given length
function hfRandomPassword(length){
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
	var pass="";
	var randomBuf = new Uint8Array(length);
	window.crypto.getRandomValues(randomBuf);
	for(var i=0;i<length;i++)
	pass += chars.charAt(Math.floor(randomBuf[i]/4));
	return pass;
}
