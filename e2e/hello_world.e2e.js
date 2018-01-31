import { expect } from "chai";
import testUtils from "./utils";

describe("application launch", () => {
  beforeEach(testUtils.beforeEach);
  afterEach(testUtils.afterEach);

  it("index page loaded", async function() {
    const { app } = this
    await app.client.waitForExist('#index-window')
  });
});
