var coreTest = require('./_core-test');
var buildPageObj = require('./_build-page-obj');

var examples = "<% EXAMPLES %>";

var pages = [];
examples.forEach(function(example) {
  pages.push(buildPageObj(example));
});

pages.forEach((page) => {
    coreTest(page);
});
