import { Design, Match, MatchConfigs, FatalError, Station } from '..';
import { Logger, LoggerLEVEL} from '../Logger';

export type DimensionConfigs = {
  name: string
  activateStation: boolean
  observe: boolean,
  loggingLevel: LoggerLEVEL
}
/**
 * @class Dimension
 * @classdesc The Dimension framework for intiating a `Design` to then run `Matches` on. Interacts with `Match` class
 * only
 * 
 * @param design - The design to use for this dimension
 * @param configs - Dimension configurations
 * @param configs.name - The optional name for the dimension
 * @param configs.loggingLevel - The logging level to be set as the default for all components in the Dimension, 
 *                               including matches, the design, and the match engine
 * @param configs.observe - Whether or not this dimension should be observed. If set to true, a station will initialized
 *                          to observe thihs dimension automatically
 * @param configs.activateStation - Whether or not a station should be activated and intialized. If configs.observe or 
 *                                  configs.activateStation are true, a station will be initialized .
 */
export class Dimension {
  
  public matches: Array<Match> = [];
  static id: number = 0;
  public name: string;
  public id: number = 0;

  public log = new Logger();

  public defaultMatchConfigs: MatchConfigs = { loggingLevel: Logger.LEVEL.INFO }

  // Default station for current node instance
  public static Station: Station = null;

  // default configs
  public configs = {
    name: '',
    activateStation: true,
    observe: true,
    loggingLevel: Logger.LEVEL.INFO
  }

  constructor(public design: Design, configs: Partial<DimensionConfigs> = {}) {

    // override configs with user provided configs
    Object.assign(this.configs, configs);

    this.log.level = this.configs.loggingLevel;

    // open up a new station for the current node process if it hasn't been opened yet and there is a dimension that 
    // is asking for a station to be initiated
    if ((this.configs.activateStation === true || this.configs.observe === true) && Dimension.Station == null) {
      Dimension.Station = new Station('Dimension Station', [], this.configs.loggingLevel);
    }
    
    // default match log level and design log level is the same as passed into the dimension
    this.defaultMatchConfigs.loggingLevel = this.configs.loggingLevel;
    this.design._setLogLevel(this.configs.loggingLevel);

    // set name
    if (this.configs.name) {
      this.name = this.configs.name;
    }
    else {
      this.name = `dimension_${Dimension.id}`;
    }
    this.id = Dimension.id;
    this.log.detail(`Created Dimension: ` + this.name);
    Dimension.id++;

    // make the station observe this dimension when this dimension is created
    if (configs.observe === true) Dimension.Station.observe(this);

    this.defaultMatchConfigs.dimensionID = this.id;
  }
  /**
   * Create a match with the given files with the given unique name. It rejects if a fatal error occurs and resolves 
   * with the initialized `match` object as specified by the `Design` of this `Dimension`
   * 
   * @param files - List of files to use to generate agents and use for a new match
   * @param matchOptions - Options for the created match
   * @param configs - Configurations that are `Design` dependent
   */
  public async createMatch(files: Array<string> | Array<{file: string, name: string}>, configs: MatchConfigs = {}): Promise<Match> {
    return new Promise( async (resolve, reject) => {
      if (!files.length) reject(new FatalError('No files provided for match'));

      // override defaults with provided configs
      // TOOD: change to deep copy
      let matchConfigs = {...this.defaultMatchConfigs};
      Object.assign(matchConfigs, configs);

      let match: Match;
      if (typeof files[0] === 'string') {
        match = new Match(this.design, <Array<string>> files, matchConfigs);
      } else {
        match = new Match(this.design, <Array<{file: string, name: string}>> files, matchConfigs);
      }
      this.matches.push(match);

      // Initialize match with initialization configuration
      try {
        await match.initialize();
      }
      catch(error) {
        reject(error);
      }
      
      // TODO: Add a automatic match resolve that removes match from dimension's own list of matches

      resolve(match);
    });
  }

  /**
   * Runs a match with the given files with the given unique name. It rejects if a fatal error occurs and resolves 
   * with the results of the match as specified by the `Design` of this `Dimension`
   * 
   * @param files - List of files to use to generate agents and use for a new match
   * @param matchOptions - Options for the created match
   * @param configs - Configurations that are `Design` dependent. These configs are passed into `Design.initialize`
   * `Design.update` and `Design.storeResults`
   */
  public async runMatch(files: Array<string> | Array<{file: string, name: string}>, configs: MatchConfigs = {}) {
    return new Promise( async (resolve, reject) => {
      
      try {
        if (!files.length) reject (new FatalError('No files provided for match'));

        // override defaults with provided configs
        // TOOD: change to deep copy
        let matchConfigs = {...this.defaultMatchConfigs};
        Object.assign(matchConfigs, configs);

        let match: Match;
        if (typeof files[0] === 'string') {
          match = new Match(this.design, <Array<string>> files, matchConfigs);
        } else {
          match = new Match(this.design, <Array<{file: string, name: string}>> files, matchConfigs);
        }
        this.matches.push(match);

        // Initialize match with initialization configuration
        await match.initialize();
        // Get results
        let results = await match.run();

        // Resolve the results
        resolve(results);
      }
      catch(error) {
        reject(error);
      }
      
    });
  }

}

/**
 * Creates a dimension for use to start matches, run tournaments, etc.
 * @param design The design to use
 * @param name The optional name of the dimension
 */
export function create(design: Design, configs?: Partial<DimensionConfigs>): Dimension {
  return new Dimension(design, configs);
}