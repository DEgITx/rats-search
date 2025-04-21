const { merge } = require("webpack-merge");
const jetpack = require("fs-jetpack");
const base = require("./webpack.base.config.cjs");

// Test files are scattered through the whole project. Here we're searching
// for them and generating entry file for webpack.

const testsDir = jetpack.cwd("tests");
const tempDir = jetpack.cwd("temp");
const entryFilePath = tempDir.path("testsInit.js");

const testsImports = testsDir
  .find({ matching: process.env.TEST ? `${process.env.TEST}.test.js` : "*.test.js" })
  .filter(test => (process.env.ALL || !test.includes('optional')))
  .reduce((fileContent, path) => {
    const normalizedPath = path.replace(/\\/g, "/");
    return `${fileContent}require("../tests/${normalizedPath}");\n`;
  }, "");

let entryFileContent = testsDir.read('init.js')
entryFileContent = entryFileContent.replace('//TESTS', testsImports)

jetpack.write(entryFilePath, entryFileContent);

module.exports = env => {
  return merge(base(env), {
    entry: entryFilePath,
    output: {
      filename: "tests.js",
      path: tempDir.path()
    }
  });
};
