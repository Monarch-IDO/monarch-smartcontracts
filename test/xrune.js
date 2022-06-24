const { expect } = require("chai");
const {
  ADDRESS_ZERO,
  expectError,
  prepare,
  deploy,
  getBigNumber,
  currentTime,
  advanceTime
} = require("./utilities");

describe("MONARCH", function() {
  before(async function() {
    await prepare(this, ["MONARCH"]);
  });

  beforeEach(async function() {
    await deploy(this, [["monarch", this.MONARCH, [this.alice.getAddress()]]]);
  });

  it("mints 500M to deployer", async function() {
    expect(await this.monarch.balanceOf(this.alice.getAddress())).to.equal(
      getBigNumber("500000000")
    );
  });

  it("allows curve to be set by admin", async function() {
    await this.monarch.setCurve(512);
    expect(await this.monarch.curve()).to.equal(512);
  });

  it("disalows curve to be set by anybody", async function() {
    expectError("caller is not the owner", async () => {
      await this.monarch.connect(this.bob).setCurve(10);
    });
  });

  it("allows reserve to be set by admin", async function() {
    await this.monarch.setReserve(this.bob.getAddress());
    expect(await this.monarch.reserve()).to.equal(await this.bob.getAddress());
  });

  it("disalows reserve to be set by anybody", async function() {
    expectError("caller is not the owner", async () => {
      await this.monarch.connect(this.bob).setReserve(this.bob.getAddress());
    });
  });

  it("allows next era to be set by admin", async function() {
    const nextEra = (await currentTime()) + 60;
    await this.monarch.setNextEra(nextEra);
    expect(await this.monarch.nextEra()).to.equal(nextEra);
  });

  it("disalows next era to be set by anybody", async function() {
    expectError("caller is not the owner", async () => {
      await this.monarch.connect(this.bob).setNextEra(0);
    });
  });

  it("disalows next era that's in the past", async function() {
    expectError("needs to be in the future", async () => {
      await this.monarch.setNextEra(9001);
    });
  });

  it("calculates initial daily emission", async function() {
    expect(await this.monarch.dailyEmission()).to.equal(
      getBigNumber("488281.25")
    );
  });

  it("dailyEmit works when era pending", async function() {
    await this.monarch.setReserve(this.bob.getAddress());
    await this.monarch.toggleEmitting();
    await advanceTime(90000);
    await this.monarch.dailyEmit();
    const nextEra = await this.monarch.nextEra();
    const dailyEmit = await this.monarch.dailyEmission();
    const previous = await this.monarch.balanceOf(this.bob.getAddress());
    await advanceTime(parseInt(await this.monarch.ERA_SECONDS()));
    await expect(this.monarch.dailyEmit())
      .to.emit(this.monarch, "NewEra")
      .withArgs(nextEra, dailyEmit);
    expect(await this.monarch.balanceOf(this.bob.getAddress())).to.equal(
      previous.add(dailyEmit)
    );
  });

  it("dailyEmit wont emit when no reserve is set", async function() {
    await this.monarch.setReserve(ADDRESS_ZERO);
    await expect(this.monarch.dailyEmit()).not.to.emit(this.monarch, "NewEra");
  });

  it("dailyEmission calculates correctly", async function() {
    expect(await this.monarch.dailyEmission()).to.equal(
      getBigNumber("488281.25")
    );
  });
});
