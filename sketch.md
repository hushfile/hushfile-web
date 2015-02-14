## Solution sketch

### Upload
The upload process is divided into two steps, encryption and upload. Each with it's own set of workers.
When a file is selected we can immediately start encrypting all chunks of the file. We must however wait
for the first chunk to finish upload in order to be able to correctly upload the subsequent chunks. 
The algorithm should do the following 

1. A file is selected
2. Spawn e workers
3. Spawn e encryption workers. Until s > filesize: s = 0
  3a. Read s+chunksize bytes from file.
  3b. Encrypt the chunk and write to temporary file
  3c. Notify main process of completion
4.  

### Download