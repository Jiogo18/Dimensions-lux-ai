const Dimension = require('../src');
let MatchStatus = Dimension.MatchStatus;
const RockPaperScissorsDesign = require('./rps').RockPaperScissorsDesign;
describe('Rock Paper Scissors Run', () => {
  let RPSDesign, myDimension_line_count, RPSDesign_line_count;
  let myDimension;
  beforeAll(() => {
    RPSDesign = new RockPaperScissorsDesign('RPS!', {
      engineOptions: {
        timeout: {
          max: 500,
        }
      }
    });
    myDimension = Dimension.create(RPSDesign, {
      name: 'RPS',
      activateStation: false,
      observe: false,
      loggingLevel: Dimension.Logger.LEVEL.WARN
    });
    RPSDesign_line_count = new RockPaperScissorsDesign('RPS!', {
      engineOptions: {
        commandFinishPolicy: 'line_count'
      }
    });
    myDimension_line_count = Dimension.create(RPSDesign_line_count, {
      name: 'RPS_line_count',
      activateStation: false,
      observe: false,
      loggingLevel: Dimension.Logger.LEVEL.WARN
    });
  })
  test('Test line count based engine', async () => {
    expect.assertions(1);
    let results = await myDimension_line_count.runMatch(
      ['./tests/js-kit/rps/line_countbot.js', './tests/js-kit/rps/line_countbotpaper.js'],
      {
        name: 'line-count (0)',
        bestOf: 10
      }
    )
    // line count bot also sends extraneous output of 's': scissors, which should all be erased by matchengine
    // we test this by ensuring the score is correct, otherwise the extraneous output would make line count bot win
    // sometimes.
    expect(results.scores).toStrictEqual({'0': 0, '1': 10});
  })
  test('Test run rock vs paper 3 times and test erasure of output', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/rock.js', './tests/js-kit/rps/paper.js'],
      {
        name: 'erasure of output (1)',
        bestOf: 100
      }
    )
    expect(results.scores).toStrictEqual({'0': 0, '1': 100});
  });
  test('Test multi-language support, run smarter bot against rock.py 5 times', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/python-kit/rps/rock.py'],
      {
        name: 'mult-lang (2)',
        bestOf: 4,
        loggingLevel: Dimension.Logger.LEVEL.ERROR
      }
    )
    // smarter agent defaults to scissors round 1 and loses to rock, then chooses paper afterward due to rock last move
    expect(results.scores).toStrictEqual({'0': 3, '1': 1});
  });
  test('Test multi-language support java, run smarter bot against Rock.java 5 times', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/java-kit/rps/Rock.java'],
      {
        name: 'mult-lang (2)',
        bestOf: 4,
        loggingLevel: Dimension.Logger.LEVEL.ERROR
      }
    )
    // smarter agent defaults to scissors round 1 and loses to rock, then chooses paper afterward due to rock last move
    expect(results.scores).toStrictEqual({'0': 3, '1': 1});
  });
  test('Test run smarter bot against paper 5 times and test erasure of output', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/js-kit/rps/paper.js'],
      {
        name: 'erasure of output (3)',
        bestOf: 30
      }
    )
    // smarter agent defaults to scissors round 1 and loses to rock, then chooses paper afterward due to rock last move
    expect(results.scores).toStrictEqual({'0': 30, '1': 0});
  });

  test('Test RPS to log match errors', async () => {
    const logSpy = jest.spyOn(console, 'log');
    expect.assertions(1);
    await myDimension.runMatch(
      ['./tests/js-kit/rps/errorBot.js', './tests/js-kit/rps/paper.js'],
      {
        name: 'log match errors (4)',
        bestOf: 5,
        loggingLevel: Dimension.Logger.LEVEL.WARN
      }
    );
    expect(logSpy).toBeCalledTimes(1);
  });

  test('Test RPS with stopping', async () => {
    expect.assertions(3);
    let match = await myDimension.createMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/js-kit/rps/paper.js'],
      {
        name: 'stop and resume (5)',
        bestOf: 1000,
        loggingLevel: Dimension.Logger.LEVEL.WARN
      }
    )
    let results = match.run();
    async function startStop(match) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (match.stop()) {
            
          } else {

          }
          
          setTimeout(() => {
            expect(match.matchStatus).toStrictEqual(MatchStatus.STOPPED);
            if (match.resume()) {
              
              resolve();
            } else {
              reject();
            }
            
          }, 100)
        }, 100)
      }, this)
    }
    
    await startStop(match);
    expect(match.matchStatus).toStrictEqual(MatchStatus.RUNNING);
    await results.then((res) => {
      expect(res.scores).toStrictEqual({'0': 1000, '1': 0});
      console.log(res.scores);
    });
  });

  describe('Testing timeout mechanism', () => {
    test('Test timeout mechanism and auto giving non terminated bot the win', async () => {
      let res = await myDimension.runMatch(
        ['./tests/js-kit/rps/paper.js', './tests/js-kit/rps/delaybotrock.js'],
        {
          bestOf: 5,
          loggingLevel: Dimension.Logger.LEVEL.ERROR
        }
      );
      expect(res.terminated[1]).toBe('terminated');
      expect(res.winner).toBe('agent_0');
    });
    test('Test timeout mechanism, both timeout', async () => {
      let res = await myDimension.runMatch(
        ['./tests/js-kit/rps/delaybotrock.js', './tests/js-kit/rps/delaybotrock.js'],
        {
          bestOf: 5,
          loggingLevel: Dimension.Logger.LEVEL.ERROR
        }
      );
      expect(res.terminated[1]).toBe('terminated');
      expect(res.terminated[0]).toBe('terminated');
      expect(res.winner).toBe('Tie');
    });
    test('Test overriding timeout mechanism', async () => {
      let res = await myDimension.runMatch(
        ['./tests/js-kit/rps/delaybotpaper.js', './tests/js-kit/rps/delaybotrock.js'],
        {
          bestOf: 3,
          loggingLevel: Dimension.Logger.LEVEL.ERROR,
          engineOptions: {
            timeout: {
              active: false
            }
          }
        }
      );
      // expect(res.terminated[1]).toBe('terminated');
      // expect(res.terminated[0]).toBe('terminated');
      expect(res.winner).toBe('agent_0');
    });
  });
})

