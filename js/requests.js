//function namingconvention: requesttypeFolderEndpoint

function getApiExists(fileid, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/api/exists?fileid='+fileid, true);
	xhr.onload = function(e) {
		if(xhr.status == 200) {
			var responseobject = eval('(' + eval('(' + xhr.responseText + ')') + ')');
			if (responseobject.exists) {
				// fileid exists
				if(success) success(responseobject);
			} else {
				if(error) error(e);
			}
		}
	}
	xhr.send();
}

function getApiMetadata(fileid, password, success, error) {
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET', '/api/metadata?fileid='+fileid, true);
	xhr2.onload = function(e) {
		if (this.status == 200) {
			var responseJson = eval('(' + CryptoJS.AES.decrypt(this.responseText, password).toString(CryptoJS.enc.Utf8) + ')');
			if(success) success(responseJson);
		} else {
			//nop for now
		};
	};
	xhr2.send();
}

function getApiIp(fileid, success, error) {
	var ipxhr = new XMLHttpRequest();
	ipxhr.open('GET', '/api/ip?fileid='+fileid, true);
	ipxhr.onload = function(e) {
		if (this.status == 200) {
			var responseJson = eval('(' + eval('(' + this.responseText + ')') + ')');			
			if(success) success(responseJson);
		} else {
			error(e);
		};
	};

	ipxhr.send();
}

function getApiFile(fileid, chunknumber, success, error) {
	var xmr = new XMLHttpRequest();
	xmr.open('GET', '/api/file?fileid='+fileid+'&chunknumber='+chunknumber);
	xmr.onload = function(e) {
		if(this.status == 200) {
			// decrypt the data
			if(success) success(xmr.responseText);
		} else {
			if(error) error(e);
		}
	}
	xmr.send()
}
