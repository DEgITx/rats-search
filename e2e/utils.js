import electron from "electron";
import { Application } from "spectron";

const beforeEach = function() {
  this.timeout(15000);
  this.app = new Application({
    path: electron,
    args: ["."],
    startTimeout: 15000,
    waitTimeout: 15000
  });
  return this.app.start();
};

const afterEach = function() {
  this.timeout(15000);
  if (this.app && this.app.isRunning()) {
    return this.app.stop();
  }
  return undefined;
};

export default {
  beforeEach,
  afterEach
};
