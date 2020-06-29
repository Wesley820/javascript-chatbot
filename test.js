const { Chatbot } = require('./index');
const readline = require('readline-sync');

const options = {
  language: 'pt',
  modelName: 'treined.nlp',
  modelTrainName: 'training.json',
  threshold: 0.2,
};

const bot = new Chatbot(options);

(async function () {
  bot.loadModel();
  // await bot.train('training.json');
  // bot.saveModel();
  while (true) {
    const input = readline.question('Diga algo: ');
    const data = await bot.classifier(input);
    console.log(JSON.stringify(data, null, 2));
  }
})();
