importScripts("js/cryptojs-aes.js");
 
self.requestFileSystemSync = self.webkitRequestFileSystemSync || self.requestFileSystemSync;
 
var file = null;
var pass = "";
 
function initialize(filename, size, passphrase) {
	pass = passphrase;
 
	try {
		var fs = requestFileSystemSync(PERSISTENT, size);
		file = fs.root.getFile(filename, { create: true, exclusive: false });
	} catch (exception) {
		postMessage({ type: "error", message: exception.message });
		return;
	}
	 
	postMessage({ type: "initialized"});
};
 
function stop() {
if (file) {
file.remove();
}
 
postMessage({ type: "stopped" });
self.close();
};
 
function append(data) {
	if (! file) {
	return;
	}
	 
	var writer = file.createWriter();
	writer.seek(writer.length);
	writer.write(new Blob([data], {type: 'text/plain'}));
	 
	postMessage({ type: "written" });
};
 
onmessage = function (e) {
var message = e.data;
 
if (!message) {
return;
}
 
switch (message.type) {
case "initialize":
initialize(message.filename, message.size, message.passphrase);
break;
 
case "stop":
stop();
break;
 
case "append":
append(message.data);
break;
 
default:
break;
}
};