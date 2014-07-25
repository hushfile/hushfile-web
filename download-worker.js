self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
importScripts('js/cryptojs-aes.js');
importScripts('js/cryptojs-uint8.js');
onmessage = function(event) {
	var message = event.data;

	var xmr = new XMLHttpRequest();
	//xmr.responseType='arraybuffer';
	xmr.open('GET', '/api/file?fileid='+message.fileid+'&chunknumber='+message.chunknumber);
	xmr.onload = function(e) {
		if(this.status == 200) {
			// decrypt the data
			decryptedwords = CryptoJS.AES.decrypt(xmr.responseText, message.password);
			ui8a = CryptoJS.enc.u8array.stringify(decryptedwords);
			foo = new Blob([ui8a], message.type);
			var fs = requestFileSystemSync(PERSISTENT, message.size);
			
			var file = fs.root.getFile('hushfile.temp',{create: !(message.start > 0), exclusive: false});
			var writer = file.createWriter();
			writer.seek(message.start);
			writer.write(foo);
			postMessage();
		}
	}
	xmr.send()
}