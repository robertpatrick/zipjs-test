'use strict';

const path = require('node:path');
const copyOperations = require('../../copyOperations.json');
const addOperations = require('../../addOperations.json');
const ZipWorker = require('./zip-worker');

const projectRootDirectory = path.normalize(`${__dirname}/../..`);
const originalZipFilePath = path.join(projectRootDirectory, 'archive.zip');
const newZipFilePath = path.join(projectRootDirectory, 'newArchive.zip');

const expectedPaths = [
  "config/wlsdeploy/custom/package.json",
  "wlsdeploy/applications/my-app.war",
  "wlsdeploy/applications/my-app.xml",
  "wlsdeploy/applications/my-other-app/META-INF/MANIFEST.MF",
  "wlsdeploy/applications/my-other-app/META-INF/maven/oracle.jcs.lifecycle/get-listen-address-app/pom.properties",
  "wlsdeploy/applications/my-other-app/META-INF/maven/oracle.jcs.lifecycle/get-listen-address-app/pom.xml",
  "wlsdeploy/applications/my-other-app/WEB-INF/classes/com/oracle/platform/GetListenAddressServlet.class",
  "wlsdeploy/applications/my-other-app/WEB-INF/classes/com/oracle/platform/ListenAddressAndPort.class",
  "wlsdeploy/applications/my-other-app/WEB-INF/web.xml",
  "wlsdeploy/applications/my-other-app/WEB-INF/weblogic.xml",
  "wlsdeploy/applications/my-other-app.war",
  "wlsdeploy/classpathLibraries/bar/Foo.class",
  "wlsdeploy/classpathLibraries/bar.jar",
  "wlsdeploy/pluginDeployments/test-plugin.jar",
  "wlsdeploy/stores/fs1/",
  "wlsdeploy/stores/fs2/",
  "wlsdeploy/stores/fs3/"
]

async function main() {
  const copyOperationsMap = _createCopyOperationsMap();
  // Fix up the filePath to package.json
  addOperations[0].filePath = path.join(projectRootDirectory, 'package.json');

  const worker = new ZipWorker(originalZipFilePath, newZipFilePath);
  await worker.init();
  await worker.updateArchiveFile(copyOperationsMap, addOperations);

  const updatedZipFileEntries = await worker.getUpdatedZipEntries();
  const errors = _compareArrays(updatedZipFileEntries, expectedPaths);
  if (errors.length > 0) {
    console.error(`Found ${errors.length} errors:`);
    errors.forEach(error => {
      console.error(`\t${error}`);
    });
  } else {
    console.log(`Updated zip file contains the expected contents`);
  }
}

function _createCopyOperationsMap() {
  const copyOperationsMap = new Map();
  for (const [ key, value ] of Object.entries(copyOperations)) {
    copyOperationsMap.set(key, value);
  }
  return copyOperationsMap;
}

function _compareArrays(actual, expected) {
  const errors = [];
  if (actual.length > expected.length) {
    errors.push(`actual array of length ${actual.length} is longer than the expected length of ${expected.length}`);
  } else if (expected.length > actual.length) {
    errors.push(`actual array of length ${actual.length} is shorter than the expected length of ${expected.length}`);
  }

  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  if (errors.length === 0) {
    for (let idx = 0; idx < sortedActual.length; idx++) {
      if (sortedActual[idx] !== sortedExpected[idx]) {
        errors.push(`Actual value at index ${idx} was ${sortedActual[idx]} but should have been ${sortedExpected[idx]}`);
      }
    }
  } else {
    for (const value of sortedActual) {
      if (!sortedExpected.includes(value)) {
        errors.push(`actual array includes value ${value} that is not expected`);
      }
    }
    for (const value of sortedExpected) {
      if (!sortedActual.includes(value)) {
        errors.push(`actual array is missing expected value ${value}`);
      }
    }
  }
  return errors;
}

main().then(() => {
  console.log('Done');
});
