const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const zip = require('@zip.js/zip.js');

const ZipFileReader = require('./zip-file-reader');
const ZipFileWriter = require('./zip-file-writer');
const { getErrorMessage } = require('./error-utils');

class ZipWorker {
  constructor(originalFile, newFile) {
    this.originalFile = path.normalize(originalFile);
    this.newFile = path.normalize(newFile);
  }

  async init() {
    if (!fs.existsSync(this.originalFile)) {
      throw new Error(`Original file ${this.originalFile} does not exist`)
    }
    if (fs.existsSync(this.newFile)) {
      await fsPromises.rm(this.newFile, { force: true });
      if (fs.existsSync(this.newFile)) {
        throw new Error(`Failed to delete the updated zip file ${this.newFile} from the previous run`)
      }
    }
  }

  async updateArchiveFile(copyOperationsMap, addOperations) {
    let zipFileReader;
    let zipReader;
    try {
      zipFileReader = new ZipFileReader(this.originalFile);
      zipReader = new zip.ZipReader(zipFileReader);
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      return Promise.reject(new Error(`Failed to open readers for file ${this.originalFile}: ${getErrorMessage(err)}`));
    }

    let zipFileWriter;
    let zipWriter;
    try {
      zipFileWriter = new ZipFileWriter(this.newFile);
      zipWriter = new zip.ZipWriter(zipFileWriter);
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
      return Promise.reject(new Error(`Failed to open writers for file ${this.newFile}: ${getErrorMessage(err)}`));
    }

    let zipPath;
    try {
      const zipEntries = await zipReader.getEntries();
      for (const zipEntry of zipEntries) {
        zipPath = zipEntry.filename;
        if (copyOperationsMap.has(zipPath)) {
          console.log(`Preparing to copy ${zipPath} from original zip file ${this.originalFile} to new zip file ${this.newFile}`);
          if (zipEntry.directory) {
            await zipWriter.add(zipPath, null);
          } else {
            const blobWriter = new zip.BlobWriter();
            await zipEntry.getData(blobWriter)
            await zipWriter.add(zipPath, new zip.BlobReader(await blobWriter.getData()));
          }
          console.log(`Copied ${zipPath} from original zip file ${this.originalFile} to new zip file ${this.newFile}`);
        } else {
          console.log(`Skipping the copying of ${zipPath} from original zip file ${this.originalFile}`);
        }
      }
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
      return Promise.reject(new Error(`Failed to copy ${zipPath} from original zip file ${this.originalFile} to new zip file ${this.newFile}: ${getErrorMessage(err)}`));
    }

    let newSourceFilePath;
    try {
      for (const addOperation of addOperations) {
        zipPath = addOperation.path;
        newSourceFilePath = addOperation.filePath;
        console.log(`Preparing to add contents of file ${newSourceFilePath} to new zip file ${this.newFile} at ${zipPath}`);
        if (addOperation.directory) {
          await zipWriter.add(addOperation.path, null);
        } else {
          const fileReader = new ZipFileReader(addOperation.filePath);
          await zipWriter.add(addOperation.path, fileReader);
          await fileReader.close();
        }
        console.log(`Added contents of file ${newSourceFilePath} to new zip file ${this.newFile} at ${zipPath}`);
      }
    } catch (err) {
      return Promise.reject(new Error(`Failed to add contents of file ${newSourceFilePath} to new zip file ${this.newFile} at ${zipPath}`));
    } finally {
      await this._closeReaders(zipFileReader, zipReader);
      await this._closeWriters(zipFileWriter, zipWriter);
    }
    return Promise.resolve();
  }

  async getUpdatedZipEntries() {
    let zipFileReader;
    let zipReader;
    try {
      zipFileReader = new ZipFileReader(this.newFile);
      zipReader = new zip.ZipReader(zipFileReader);
    } catch (err) {
      await this._closeReaders(zipFileReader, zipReader);
      return Promise.reject(new Error(`Failed to open readers for file ${this.newFile}: ${getErrorMessage(err)}`));
    }

    const files = [];
    try {
      const zipEntries = await zipReader.getEntries();
      zipEntries.forEach((zipEntry) => {
        files.push(zipEntry.filename);
      });
    } catch (err) {
      return Promise.reject(new Error(`Failed to get entries for file ${this.newFile}: ${getErrorMessage(err)}`));
    } finally {
      this._closeReaders(zipFileReader, zipReader).then();
    }
    return Promise.resolve(files);
  }

  async _closeReaders(zipFileReader, zipReader) {
    if (!!zipFileReader) {
      try { await zipFileReader.close(); } catch(err) { }
    }
    if (!!zipReader) {
      try { zipReader.close(); } catch(err) { }
    }
  }

  async _closeWriters(zipFileWriter, zipWriter) {
    if (!!zipFileWriter) {
      try { await zipFileWriter.close(); } catch(err) { }
    }
    if (!!zipWriter) {
      try { zipWriter.close(); } catch(err) { }
    }
  }
}

module.exports = ZipWorker;
