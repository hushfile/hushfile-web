self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;

onmessage = function(event) {
	var message = event.data;

	var fs = requestFileSystemSync(PERSISTENT, message.totalsize);

	var file = fs.root.getFile('hushfile.temp', {create: true});
	postMessage({file: file.file()});
}