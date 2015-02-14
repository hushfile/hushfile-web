## Hushfile tutorial

## How does it work?
Hushfile.it is a 0-knowledge file storage service. This means that the hosting
services never has access to unencrypted content as well as any passwords used
to unencrypt the contents of any files.

To ensure that hushfile.it cannot read any content, all data is encrypted by the
client side application before it is sent to the server. Upon upload completion
a unqiue link is produced consisting of a file location on the hushfile.it server
as well as a secret password which can be used for decryption.
The encryption key is passed as the anchor part of the url. This means that 
event though the link is pasted directly into a browser, the anchor part is never 
sent to the server and encryption security is therefore never compromised.


## Upload
1. Click on the upload button
2. Choose a file and wait for the upload to finish
3. When the upload is finished a green button with a link appears.
   You can right click the button and choose "Copy link location"
4. Send the link via IM, email or similar.
   
    Tip: For extra privacy, you can send the part after the '#' (hashtag)
    on a separate channel.

## Download
1. If a password was not supplied in the link, paste the password you obtained
   and press the "Go" button.
2. Press the "Get and decrypt" button.
3. When download and decryption is complete, press the "Download" button or 
   the file preview in order to save the file to disc. 