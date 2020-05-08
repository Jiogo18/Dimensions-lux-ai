import * as Dimension from '../src';
import { DominationDesign } from './domination';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from "sinon-chai";
import 'mocha';
import { Station, Logger } from '../src';
import { NanoID } from '../src/Dimension';
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const importTest = (name:string, path: string) => {
  describe(name, function () {
      require(path);
  });
}

let station: Station;
describe('Testing Station Class', () => {
  it('should not activate a station when asked', () => {
    let dominationDesign = new DominationDesign('Domination');
    let d = Dimension.create(dominationDesign, {
      activateStation: false,
      observe: false,
      loggingLevel: Logger.LEVEL.NONE
    });
    station = d.getStation();
    expect(station).to.equal(null);
  });
  it('should activate a station when asked but also not observe if necessary', () => {
    let dominationDesign = new DominationDesign('Domination');
    let d = Dimension.create(dominationDesign, {
      activateStation: true,
      observe: false,
      loggingLevel: Logger.LEVEL.NONE
    });
    station = d.getStation();
    expect(station).to.not.equal(null);
    let dimensions = <Map<NanoID, Dimension.DimensionType>>station.app.get('dimensions');
    expect(dimensions.size).to.equal(0);
  });
  it('should observe if asked', () => {
    let dominationDesign = new DominationDesign('Domination');
    let d = Dimension.create(dominationDesign, {
      observe: true,
      loggingLevel: Logger.LEVEL.NONE
    });
    station = d.getStation();
    expect(station).to.not.equal(null);
    let dimensions = <Map<NanoID, Dimension.DimensionType>>station.app.get('dimensions');
    expect(dimensions.get(d.id).id).to.equal(d.id);
  });
  it('should restart', () => {
    return expect(station.restart()).to.be.fulfilled;
  });
  describe('Run imported', () => {
    importTest('API /dimensions', './stationAPITests/dimension/index.subspec.ts');
    importTest('API /dimensions/match', './stationAPITests/dimension/match/index.subspec.ts');
  });
  after(() => {
    station.stop();
  });

  
});