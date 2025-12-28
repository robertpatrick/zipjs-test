const { Buffer } = require('node:buffer');
const fsPromises = require('node:fs/promises');
const zip = require('@zip.js/zip.js');

class ZipFileWriter extends zip.Writer {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async init(size = undefined) {
    await super.init(size);
    const fileURI = new URL(this.filename, 'file:///');
    this.fileHandle = await fsPromises.open(fileURI, 'w');
    this.position = 0;
    this.bufferCount = 0;
  }

  async writeUint8Array(uint8Array) {
    await this.fileHandle.write(Buffer.from(uint8Array), 0, uint8Array.length, this.position);
    console.log(`Wrote array buffer ${this.bufferCount} of length ${uint8Array.length} at position ${this.position}`);
    this.position += uint8Array.length;
    this.bufferCount += 1;
  }

  async close() {
    console.log(`Closing ZipFileWriter for updated archive file ${this.filename}`);
    await this.fileHandle.close();
  }
}

module.exports = ZipFileWriter;
