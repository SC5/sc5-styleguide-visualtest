var buildPageObj = require('./_build-page-obj');

var examples = "<% EXAMPLES %>";

var pages = [];
examples.forEach(function(example) {
  pages.push(buildPageObj(example));
});

var testCode = require('<% TEST_PATH %>');

pages.forEach((page) => {
    testCode(page);
});
