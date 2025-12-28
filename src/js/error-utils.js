'use strict';

function getErrorMessage(err) {
  let results = '';
  if (err) {
    if (err.message) {
      results = err.message;
    } else {
      results = err.toString().trim();
    }
  }
  return results;
}

module.exports = {
  getErrorMessage
};
