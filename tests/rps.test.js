// const Dimension = require('dimensions-ai');
const Dimension = require('../src');
const MatchStatus = Dimension.MatchStatus;

/**
 * This rock paper scissors game lets 2 agents play a best of n rock paper scissors 
 */
class RockPaperScissorsDesign extends Dimension.Design{
  async initialize(match) {
    // This is the initialization step of the design, where you decide what to tell all the agents before they start
    // competing
    // You are given the match itself, and the configuration you passed in when running a match

    // let's create a state that persists through the entire match and can be updated in the update function
    let state = {
      maxRounds: match.configs.bestOf, // we will store the max rounds of rock paper scissors this game will run
      results: [], // we will also store the winner of each of those rounds by each agent's ID
      rounds: 0 // rounds passed so far
    }
    match.state = state; // this stores the state defined above into the match for re-use

    // Each match has a list of agents in match.agents, we can retrieve each of their IDs using agent.id
    // each agent ID is numbered from 0,... n-1 in a game of n agents. In this game, theres only two agents
    // agent0 and agent1
    for (let i = 0; i < 2; i++) {
      let agent = match.agents[i];

      // Here, we are sending each agent their own ID. This is a good practice for any AI competition design
      // The first arg is the message, the second arg is the id of the agent you want to send the message to
      // We use await to ensure that these ID messages are sent out first
      await match.send(`${agent.id}`, agent.id);
    }

    // we also want to send every agent the max number of rounds
    await match.sendAll(match.state.maxRounds);

    // This is initialization done!
  }
  async update(match, commands) {
    // This is the update step of the design, where all the run-time game logic goes
    // You are given the match itself, all the commands retrieved from the last round / time step from all agents, and
    // the original configuration you passed in when running a match.
    
    // if no commands, just return and skip update
    if (!commands.length) return;

    let winningAgent;

    // each command in commands is an object with an agentID field and a command field, containing the string the agent sent
    let agent0Command;
    let agent1Command;
    // there isn't a gurantee in the command order, so we need to loop over the commands and assign them correctly
    for (let i = 0; i < 2; i++) {
      if (commands[i].agentID === 0)  {
        agent0Command = commands[i].command;
      }
      else if (commands[i].agentID === 1) {
        agent1Command = commands[i].command;
      }
    }

    // We have that each agent will give us a command that is one of 'R', 'P', or 'S' indicating Rock, Paper, Scissors
    // if it isn't one of them, then we throw a MatchError, which doesn't stop the match but prints to console the error
    let validChoices = new Set(['R', 'P', 'S']);
    if (!validChoices.has(agent0Command)) match.throw(0, new Dimension.MatchError('agent 0\'s ' + agent0Command + ' is not a valid command!'));
    if (!validChoices.has(agent1Command)) match.throw(1, new Dimension.MatchError('agent 1\'s ' + agent1Command + ' is not a valid command!'));

    // now we determine the winner, agent0 or agent1? or is it a tie?
    if (agent0Command === agent1Command) {
      // it's a tie if they are the same, so we set winningAgent = -1 as no one won!
      winningAgent = -1
    }
    else if (agent0Command === 'R') {
      if (agent1Command === 'P') {
        winningAgent = 1; // paper beats rock
      }
      else {
        winningAgent = 0;
      }
    }
    else if (agent0Command === 'P') {
      if (agent1Command === 'S') {
        winningAgent = 1; // scissors beats paper
      }
      else {
        winningAgent = 0;
      }
    }
    else if (agent0Command === 'S') {
      if (agent1Command === 'R') {
        winningAgent = 1; // rock beats scissors
      }
      else {
        winningAgent = 0;
      }
    }

    // update the match state
    match.state.results.push(winningAgent);
    // we increment the round if it wasn't a tie
    if (winningAgent != -1) match.state.rounds++;

    // we send the status of this round to all agents
    match.sendAll(winningAgent);
    // we also want to tell the opposing agents what their opponents used last round
    match.send(agent1Command, 0);
    match.send(agent0Command, 1);

    // we now check the match status
    // if rounds reaches maxrounds, we return MatchStatus.FINISHED
    if (match.state.rounds === match.state.maxRounds) {
      return MatchStatus.FINISHED;
    }

    // not returning anything makes the engine assume the match is still running
  }
  async getResults(match) {
    // This is the final, result collection step occuring once the match ends
    let results = {
      scores: {
        0: 0,
        1: 0,
      },
      ties: 0,
      winner: ''
    }

    // we now go over the round results and evaluate them
    match.state.results.forEach((res) => {
      if (res !== -1) {
        // if it wasn't a tie result, update the score
        results.scores[res] += 1;
      }
      else {
        // otherwise add to ties count
        results.ties += 1;
      }
    });

    // determine the winner and store it
    if (results.scores[0] > results.scores[1]) {
      results.winner = match.agents[0].name;
    }
    else if (results.scores[0] < results.scores[1]) {
      results.winner = match.agents[1].name;
    }
    else {
      results.winner = 'Tie';
    }
    
    // we have to now return the results 
    return results;
  }
}

let RPSDesign = new RockPaperScissorsDesign('RPS!');
let myDimension = Dimension.create(RPSDesign, 'Domination', Dimension.Logger.LEVEL.WARN);
describe('Rock Paper Scissors Run', () => {
  test('Test run rock vs paper 3 times', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/rock.js', './tests/js-kit/rps/paper.js'],
      {
        bestOf: 3
      }
    )
    expect(results.scores).toStrictEqual({'0': 0, '1': 3});
  });
  test('Test run smarter bot against rock.py 5 times', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/js-kit/rps/rock.py'],
      {
        bestOf: 5
      }
    )
    // smarter agent defaults to scissors round 1 and loses to rock, then chooses paper afterward due to rock last move
    expect(results.scores).toStrictEqual({'0': 4, '1': 1});
  });
  test('Test run smarter bot against paper 5 times', async () => {
    expect.assertions(1);
    let results = await myDimension.runMatch(
      ['./tests/js-kit/rps/smarter.js', './tests/js-kit/rps/paper.js'],
      {
        bestOf: 5
      }
    )
    // smarter agent defaults to scissors round 1 and loses to rock, then chooses paper afterward due to rock last move
    expect(results.scores).toStrictEqual({'0': 5, '1': 0});
  });

  test('Test RPS to log match errors', async () => {
    const logSpy = jest.spyOn(console, 'log');
    expect.assertions(1);
    await myDimension.runMatch(
      ['./tests/js-kit/rps/errorBot.js', './tests/js-kit/rps/paper.js'],
      {
        bestOf: 5,
        loggingLevel: Dimension.Logger.LEVEL.WARN
      }
    );
    expect(logSpy).toBeCalledTimes(5);
  });
})
