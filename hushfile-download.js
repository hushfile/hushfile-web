// function to download and decrypt metadata
function hfGetMetadata(fileid) {
	var password = window.location.hash.substr(1);

	// download and decrypt metadata
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET', '/api/metadata?fileid='+fileid, true);
	xhr2.onload = function(e) {
		if (this.status == 200) {
			// decrypt metadata
			try {
				metadata = CryptoJS.AES.decrypt(this.response, password).toString(CryptoJS.enc.Utf8);
			} catch(err) {
				content = '<div class="alert alert-error">Unable to decrypt metadata, invalid password.</div>\n';
				content += '<div class="alert alert-info">Enter password:</div>\n';
				content += '<input type="text" id="password">\n';
				content += '<button type="button" class="btn btn-large btn-success" onclick="hfPwRedirect(\'' + fileid + '\');">Go</button>\n';
				hfSetContent(content,'download');
				return;
			};
			
			if(metadata != 'undefined') {
				try {
					var jsonmetadata = JSON.parse(metadata);
					$('#metadata').show();
					$('#filename').html(jsonmetadata.filename);
					$('#mimetype').html(jsonmetadata.mimetype);
					$('#filesize').html(jsonmetadata.filesize);
					$('#deletepassword').html(jsonmetadata.deletepassword);
				} catch(err) {
					hfSetContent('<div class="alert alert-error">Unable to parse metadata, sorry.</div>\n','download');
					return;
				};
			};
		} else {
			hfSetContent('<div class="alert alert-error">Unable to download metadata, sorry.</div>\n','download');
			return;
		};
	};
	xhr2.send();
	
	// create XHR to get IP
	var ipxhr = new XMLHttpRequest();
	ipxhr.open('GET', '/api/ip?fileid='+fileid, true);
	ipxhr.onload = function(e) {
		if (this.status == 200) {
			var jsonip = JSON.parse(ipxhr.responseText);
			document.getElementById('clientip').innerHTML = jsonip.uploadip;
		} else {
			alert("An error was encountered getting uploader ip.");
		};
	};

	// send IP request
	ipxhr.send();
}


function hfDownloadChunk(fileid, chunknumber, totalchunks, password, completion, oldblob) {
	// disable the download button
	// make download progress bar div visible
	$('#downloadbtn').addClass("btn btn-large btn-primary btn-success disabled");
	$('#downloading').show();

	$.ajax({
		url: '/api/file?fileid='+fileid+'&chunknumber='+chunknumber,
		type: 'GET',
		success: function(response) {
			// decrypt the data
			decryptedwords = CryptoJS.AES.decrypt(response, password);
			ui8a = CryptoJS.enc.u8array.stringify(decryptedwords);
			reader = new FileReader();
			contents = [];
			var type = {type: $('#mimetype').html()};

			if(oldblob == undefined){
				fileblob = new Blob([ui8a],type);
			} else {
				fileblob = new Blob([oldblob, ui8a], type);
			}
			
			if(++chunknumber < totalchunks) {
				var temp = Math.round(chunknumber/totalchunks * 100) + '%';
				$('#download_progress_bar_percent').css('width', temp).text(temp);
				hfDownloadChunk(fileid, chunknumber, totalchunks, password, completion, fileblob);
			} else {
				$('#download_progress_bar_percent').css('width', '100%').text('100%');
				return completion(fileblob);
			}
		},
		error: function(){
			alert("An error was encountered downloading filedata.");
		}
	});
}


//function that downloads the file to the browser, and decrypts and shows download button
function hfDownload(fileid, totalchunks) {
	// get password from window.location
	var password = window.location.hash.substr(1);

	hfDownloadChunk(fileid, 0, totalchunks, password, function() {
			//done downloading, make downloading div green and change icon
			$('#downloading').css('color', 'green');
			$('#downloadingdone').removeClass('icon-spinner icon-spin').addClass("icon-check"); //explicitly clear classes?

			//make the decrypting div visible
			$('#decrypting').show().css('color', 'green');

			//done decrypting, change icon and make div green
			$('#decryptingdone').removeClass('icon-spinner icon-spin').addClass("icon-check");
			

			// download button
			a = document.createElement("a");
			a.href = window.URL.createObjectURL(fileblob);
			a.download = $('#filename').html();
			linkText = document.createTextNode(" Download");
			i = document.createElement("i");
			i.className="icon-save icon-large";
			a.appendChild(i);
			a.appendChild(linkText);
			a.className = "btn btn-large btn-primary btn-success";
			$('#downloaddiv').append(a);
			
			//make div visible
			$('#downloaddiv').show();
			
			// if this is an image, make a preview
			if((/image/i).test($('#mimetype').html())){
				img = document.createElement("img");
				img.className="img-rounded";
				img.src = window.URL.createObjectURL(fileblob);
				a = document.createElement("a");
				a.href = window.URL.createObjectURL(fileblob);
				a.download = document.getElementById('filename').innerHTML;
				a.appendChild(img);
				$('#filepreview').append(a);
				$('#previewdiv').show();
			};
	});
};


// function to redirect the browser after a new password has been entered
function hfPwRedirect(fileid) {
	password = $('#password').value;
	window.location = "/"+fileid+"#"+password;
	// show download page
	hfShowPage('download.html','download');
};


//function that deletes the file
function hfDeleteFile(fileid) {
	// disable the delete button
	$('#delete').addClass("btn btn-large btn-primary btn-success disabled");
	$('#deleting').show();
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/api/delete?fileid='+fileid+'&deletepassword='+$('#deletepassword').html(), true);

	xhr.onload = function(e) {
		$('#deleteresponse').show();
		if (this.status == 200) {
			//parse response json
			var responseobject = JSON.parse(xhr.responseText);
			if(responseobject.deleted) {
				//file deleted OK
				$('#deletingdone').addClass("icon-check");
				$('#deleteresponse').html("<div class='alert alert-success'>File deleted successfully</div>\n");
			} else {
				//unable to delete file
				$('#deletingdone').addClass("icon-warning-sign");
				$('#deleteresponse').html("<div class='alert alert-error'>Unable to delete file</div>\n");
			};
		} else if (this.status == 401) {
			$('#deletingdone').addClass("icon-warning-sign");
			$('#deleteresponse').html("<div class='alert alert-error'>Incorrect deletepassword</div>\n");
		};
	};
	
	xhr.send();
}


function hfDeleteConfirm(result) {
	if (result === true) {
		hfDeleteFile(window.location.pathname.substr(1));
	}
}
