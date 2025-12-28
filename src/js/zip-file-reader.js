'use strict';

const { Buffer } = require('node:buffer');
const fsPromises = require('node:fs/promises');
const zip = require('@zip.js/zip.js');
const { getErrorMessage } = require('./error-utils');

class ZipFileReader extends zip.Reader {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async init() {
    await super.init();
    const fileURI = new URL(this.filename, 'file:///');
    const stats = await fsPromises.stat(fileURI);
    this.size = stats.size;
    this.fileHandle = await fsPromises.open(fileURI, 'r');
  }

  async readUint8Array(offset, length) {
    if (offset + length > this.size) {
      length = this.size - offset;
    }
    if (length > 0) {
      const buffer = new Buffer(length);
      await this.fileHandle.read(buffer, 0, length, offset);
      return new Uint8Array(buffer);
    } else {
      return new Uint8Array(Buffer.alloc(0));
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.fileHandle.close().then(() => {
        resolve();
      }).catch((err) => {
        reject(new Error(`Failed to close file handle for ${this.filename}: ${getErrorMessage(err)}`));
      });
    });
  }
}

module.exports = ZipFileReader;