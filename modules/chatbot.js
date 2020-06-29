const { NlpManager } = require('node-nlp');
const path = require('path');
const { path: rootPath } = require('app-root-path');
const fileSystem = require('fs');
const extractorKeyword = require('keyword-extractor');

module.exports = Chatbot;

function Chatbot({ language, modelName, modelTrainName, threshold }) {
  const modelFileName = modelName || 'model.nlp';
  this.modelOriginal = modelTrainName || 'model.nlp';

  this.modelOriginal = require(path.resolve(
    rootPath,
    'datasets',
    this.modelOriginal
  ));

  this.language = language;
  this.pathDatasetSave = path.resolve(rootPath, 'datasets', modelFileName);

  this.manager = new NlpManager({
    languages: [this.language || 'en'],
    threshold: threshold || 0.5,
    autoLoad: false,
    autoSave: false,
    modelFileName,
  });
}

async function train() {
  this.modelOriginal.intents.forEach(({ tag, examples }) => {
    for (let i = 0; i < examples.length; i++) {
      this.manager.addDocument(this.language, examples[i].text, tag);
    }
  });

  await this.manager.train();
  return;
}

function saveModel() {
  this.manager.save(this.pathDatasetSave);
}

function loadModel() {
  const pathDataset = path.resolve(this.pathDatasetSave);
  const data = fileSystem.readFileSync(pathDataset, 'utf8');

  this.manager.import(data);
}

async function classifier(sentence) {
  if (!sentence) throw Error;
  const result = await this.manager.process(this.language, sentence);
  const sanitizeResult = sanitizeResponse(result, this.modelOriginal);
  return sanitizeResult;
}

function sanitizeResponse(data, dataset) {
  let dialog = dataset.dialogs.filter((dialog) => {
    return data.intent === dialog.intent;
  });

  dialog = dialog[0];

  if (dialog.extract_entities) {
    dialog.entities = extractEntities(data.utterance, dialog.intent);
  }

  return choosesRandomAnswer(dialog);
}

function extractEntities(sentence, intent) {
  const options = {
    language: 'portuguese',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
  };

  const entities = extractorKeyword.extract(sentence, options);

  return {
    [intent]: entities,
  };
}

function choosesRandomAnswer(dialog) {
  const { intent, output, context, entities } = dialog;
  let result = [];

  for (let i = 0; i < output.length; i++) {
    const random = Math.floor(Math.random() * output[i].values.length);

    result = [
      ...result,
      {
        type: output[i].type,
        value: output[i].values[random],
      },
    ];
  }

  return {
    intent,
    output: result,
    entities,
    context,
  };
}

Chatbot.prototype.train = train;
Chatbot.prototype.saveModel = saveModel;
Chatbot.prototype.loadModel = loadModel;
Chatbot.prototype.classifier = classifier;
