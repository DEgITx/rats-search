import { expect } from "chai";
import testUtils from "./utils";

describe("application launch", () => {
  before(testUtils.beforeEach);
  after(testUtils.afterEach);

  it("index page loaded", async function() {
    const { app } = this
    await app.client.waitForExist('#index-window')
  });
});
