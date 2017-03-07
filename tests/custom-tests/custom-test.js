'use strict';

module.exports = function (page) {
  gemini.suite(page.name, function (suite) {
    suite.setUrl(page.url).setCaptureElements('body').capture('plain', function (actions, find) {

      actions.waitForElementToShow('shadow-dom', 7000);
      actions.click('.simple-block');
      actions.wait(500);
    });

  });
};
