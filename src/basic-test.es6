var gemini = require('gemini');

var examples = require('./pages-list');

var pages = [];
pages.push({
  'name': 'index',
  url: '/styleguide/#'
});
examples.forEach(function(example) {
  pages.push({
    'name': example,
    url: '/section/' + example + '/fullscreen'
  });
});

pages.forEach(function(page) {

  gemini.suite(page.name, function(suite) {
      if (page.name === 'index') {
        suite.skip();
      }
      suite.setUrl(page.url)
          .setCaptureElements('body')
          .capture('plain', function(actions, find){

              actions.waitForElementToShow('shadow-dom', 7000);
              actions.wait(500);


          });

      // Do not consider navigation arrows
      // Change to arrows when this is fixed https://github.com/gemini-testing/gemini/issues/192

      var selectors = [
        // List selectors to ignore here, like '.class'
      ];
      // Insert additions
      try {
        var options = require('./gemini-test_' + page.name);
        if (options.selectorsToIgnore) {
          selectors = selectors.concat(options.selectorsToIgnore);
        }
      } catch (ex) {

      }
      suite.ignoreElements.apply(gemini, selectors);
  });

});
