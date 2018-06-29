import {startApplication, stopApplication} from "../tests/application";

describe("application", () => {
  before(startApplication);
  after(stopApplication);

  it("check start", async function() {
    const { app } = this
    await app.client.waitForExist('#index-window')
  });

  //TESTS
});
