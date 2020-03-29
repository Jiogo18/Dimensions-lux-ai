const Dimension = require('../src');
const { DominationDesign } = require('./domination');


let dominationDesign = new DominationDesign('Domination');
let myDimension = Dimension.create(dominationDesign, 'Domination', Dimension.Logger.LEVEL.NONE);

test('Test Run A match of Domination', async () => {
  expect.assertions(2);

  let jsSource = "./tests/js-kit/domination/random.js";
  let botSources = [];

  // sets up a deterministic game where all bots will end up expanding down
  for (let i = 0; i < 4; i++) {
    botSources.push(jsSource);
  }
  let expectedResultMap = [ [ 0, 1, 2, 3 ], [ 0, 1, 2, 3 ], [ 0, 1, 2, 3 ], [ 0, 1, 2, 3 ] ];
  let expectedScore = 4; 

  let results: any = await myDimension.runMatch(
    botSources,
    {
      name: 'test-domination-match',
      timeout: 1000,
      initializeConfig:{
        
        size: 4,
        maxRounds: 5
      },
      loggingLevel: Dimension.Logger.LEVEL.INFO
    }
  );
  expect(results.finalMap).toStrictEqual(expectedResultMap)
  expect(results.winningScore).toStrictEqual(expectedScore);
  // console.table(results.finalMap)
  // console.log(results);
});

describe('Receive MatchErrors and FatalErrors from a match of Domination', () => {
  

  expect.assertions(3);
  test('Match Errors', async () => {
    let jsSource = "./tests/js-kit/domination/errorProvokingBot.js";
    let botSources = [];

    // sets up a deterministic game where all bots will end up expanding down
    for (let i = 0; i < 3; i++) {
      botSources.push(jsSource);
    }
    botSources.push("./tests/js-kit/domination/deterministic.js")
    let expectedResultMap = [ [ 0, 1, 2, 3 ], [ 3, 3, 3, 3 ], [ -1, -1, -1, -1 ], [ -1, -1, -1, -1 ] ];
    let expectedScore = 5; 

    
    let match: any = await myDimension.createMatch(
      botSources,
      {
        name: 'test-domination-match-matcherrors',
        timeout: 1000,
        initializeConfig:{
          
          size: 4,
          maxRounds: 5
        },
        loggingLevel: Dimension.Logger.LEVEL.WARN
      }
    );

    const matchEngineLogSpy = jest.spyOn(console, 'log')

    let status: Dimension.MatchStatus;
    // Run match
    do {
      status = await match.run();
    }
    while (status != Dimension.MatchStatus.FINISHED)
    
    // Store results
    let results = await match.getResults();

    expect(results.finalMap).toStrictEqual(expectedResultMap)
    expect(results.winningScore).toStrictEqual(expectedScore);
    expect(matchEngineLogSpy).toBeCalledTimes(12);
  });

  test('Fatal Errors', async () => {
    expect.assertions(2);
    let botSources = [];
    for (let i = 0; i < 3; i++) {
      botSources.push('./tests/js-kit/domination/deterministic.js');
    }
    botSources.push('./tests/js-kit/domination/fakefile.js');

    // Throw invalid file errors
    expect(myDimension.createMatch(
      botSources,
      {
        name: 'test-domination-match-matcherrors',
        timeout: 1000,
        initializeConfig:{
          size: 4,
          maxRounds: 5
        }
      }
    )).rejects.toThrowError(Dimension.FatalError);

    // Throw missing file error
    expect(myDimension.createMatch(
      [],
      {
        name: 'test-domination-match-matcherrors',
        timeout: 1000,
        initializeConfig:{
          size: 4,
          maxRounds: 5
        }
      }
    )).rejects.toThrowError(Dimension.FatalError);
  });
});

describe('Test Create Match and Validate its contents', () => {
  const agentCount = 4;
  let match: Dimension.Match;
  beforeAll( async () => {
    let jsSource = "./tests/js-kit/domination/deterministic.js";
    let botSources = [];

    // sets up a deterministic game where all bots will end up expanding down
    for (let i = 0; i < agentCount; i++) {
      botSources.push({file:jsSource, name:'bob ' + i});
    }
    match = await myDimension.createMatch(
      botSources,
      {
        name: 'test-domination-match-validate-props',
        initializeConfig:{
          size: agentCount,
          maxRounds: agentCount + 1
        },
      }
    );
  });
  test('Validate Agents', () => {
    
    expect(match.agents.length).toBe(agentCount);
    expect(match.agentFiles.length).toBe(agentCount);
    for (let i = 0; i < match.agentFiles.length; i++) {
      let agent = match.agents[i];
      expect(agent.cmd).toBe('node'); // ensure right command was passed
      expect(agent.name).toBe('bob ' + i); // ensure naming worked
      expect(agent.process).not.toBe(null); // ensure processes were made
      expect(agent.process.killed).toBe(false); // ensure processes are alive after initiation
    }
  });
});

// TODO: fix, how to we capture if it actually logged or not?
describe('Test Logger', () => {
  let log = new Dimension.Logger();
  beforeEach(() => {
    log = new Dimension.Logger();
  });
  test('Default INFO level logging', () => {
    expect(log.level).toBe(Dimension.Logger.LEVEL.INFO);
  })
  test('Detail', () => {
    const spy = jest.spyOn(log, 'detail');
    log.detail('hello');
    expect(spy).lastCalledWith('hello');
  })
})