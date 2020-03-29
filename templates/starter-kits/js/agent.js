const fs = require('fs');
const readline = require('readline');

// Create parser and use ',' as the delimiter between commands being sent by the `Match` and `MatchEngine`
const Parser = require('./parser');
const parse = new Parser(',');

/**
 * Agent Control for sequential `Designs`
 */
class AgentControl {
  _setup() {

    // Prepare to read input
    const rl = readline.createInterface({
      input: process.stdin,
      output: null,
    });

    let buffer = [];
    let currentResolve;
    const makePromise = function() {
      return new Promise((resolve) => {
        currentResolve = resolve;
      });
    };
    // on each line, push line to buffer
    rl.on('line', (line) => {
      buffer.push(line);
      currentResolve();
      currentPromise = makePromise();
    });

    // The current promise for retrieving the next line
    let currentPromise = makePromise();
    
    // with await, we pause process until there is input
    const getLine = async () => {
      return new Promise(async (resolve) => {
        while (buffer.length === 0) {
          // pause while buffer is empty, continue if new line read
          await currentPromise;
        }
        // once buffer is not empty, resolve the most recent line in stdin, and remove it
        resolve(parse(buffer.shift()));
      });
    };
    this.getLine = getLine;
  }

  /**
   * Constructor for a new agent controller
   * User should edit this according to the `Design` this agent will compete under
   */
  constructor() {
    this._setup(); // DO NOT REMOVE
  }

  /**
   * Initialize Agent for the `Match`
   * User should edit this according to the `Design` this agent will compete under
   */
  async initialize() {

    // use (await this.getLine()) to get a parsed line of commands from the match engine
    // This parsed line is an object from which you can get the nextInt, nextFloat, nextIntArr etc..

  }
  /**
   * Updates agent's own known state of `Match`
   * User should edit this according to the `Design` this agent will compete under
   */
  async update() {

    // wait for the engine to send the result of the last round, which is the ID of the agent who won
    let result = (await this.getLine()).nextInt();
    this.roundResults.push(result);

    // wait for the engine to send you the opponent's last move, which is either 'R', 'P', or 'S'
    let lastOpponentMove = (await this.getLine()).nextStr();
    this.pastOpponentMoves.push(lastOpponentMove);
  }

  /**
   * End a 'turn'
   * Effectively tells the `MatchEngine` to stop processing this agent's commands and mark this agent as finished for 
   * the current timeStep
   */
  endTurn() {
    console.log('D_FINISH');
  }
}

module.exports = AgentControl;