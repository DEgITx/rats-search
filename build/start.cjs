const childProcess = require("child_process");
const electron = require("electron");
const webpack = require("webpack");
const config = require("./webpack.app.config.cjs");

const env = "development";
const compiler = webpack(config(env));
let electronStarted = false;

const watching = compiler.watch({}, (err, stats) => {
  // Handle and display errors from webpack itself
  if (err) {
    console.error("Webpack compiler error:", err);
    return;
  }
  
  // Format and display compilation stats (errors and warnings)
  const output = stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  });
  
  // Log the formatted output
  console.log(output);
  
  // Start Electron only if no compilation errors
  if (!stats.hasErrors() && !electronStarted) {
    console.log("\n-=-=-= Starting Rats, arrr! =-=-=-");
    electronStarted = true;

    childProcess
      .spawn(electron, ["."], { stdio: "inherit" })
      .on("close", () => {
        watching.close();
      });
  }
});
