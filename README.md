To run this project, make sure you have Node.js 22 LTS installed and then do the following:

1. `npm install`
2. `node .`

This will generate an error that looks similar to the following:

```shell
...
Preparing to add contents of file /Users/rpatrick/tmp/zipjs-test/package.json to new zip file /Users/rpatrick/tmp/zipjs-test/newArchive.zip at config/wlsdeploy/custom/package.json
Wrote array buffer 39 of length 111 at position 9603
Wrote array buffer 40 of length 167 at position 9714
Wrote array buffer 41 of length 12 at position 9881
Added contents of file /Users/rpatrick/tmp/zipjs-test/package.json to new zip file /Users/rpatrick/tmp/zipjs-test/newArchive.zip at config/wlsdeploy/custom/package.json
Closing ZipFileWriter for updated archive file /Users/rpatrick/tmp/zipjs-test/newArchive.zip
node:internal/fs/promises:460
    const err = new Error(handle[kCloseReason] ?? 'file closed');
                ^

Error: file closed
    at fsCall (node:internal/fs/promises:460:17)
    at FileHandle.write (node:internal/fs/promises:230:12)
    at ZipFileWriter.writeUint8Array (/Users/rpatrick/tmp/zipjs-test/src/js/zip-file-writer.js:20:27)
    at Object.write (/Users/rpatrick/tmp/zipjs-test/node_modules/@zip.js/zip.js/index.cjs:2479:19)
    at invokePromiseCallback (node:internal/webstreams/util:172:10)
    at node:internal/webstreams/util:177:23
    at writableStreamDefaultControllerProcessWrite (node:internal/webstreams/writablestream:1129:5)
    at writableStreamDefaultControllerAdvanceQueueIfNeeded (node:internal/webstreams/writablestream:1255:5)
    at writableStreamDefaultControllerWrite (node:internal/webstreams/writablestream:1118:3)
    at writableStreamDefaultWriterWrite (node:internal/webstreams/writablestream:1008:3) {
  code: 'EBADF',
  syscall: 'write'
}
```
