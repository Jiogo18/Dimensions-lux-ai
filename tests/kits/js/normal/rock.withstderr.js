const kit = require('./kit');
const agent = new kit.Agent();
agent.initialize().then(async () => {
  while(true) {
    console.log('R'); // tell the match you want to play Rock in the game
    console.error("test");
    agent.endTurn(); // end turn
    await agent.update(); // wait for updates
  }
});