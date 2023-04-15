const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config()
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function run(textToModerate) {
const response = await openai.createModeration({
  input: textToModerate,
});
const results = response.data.results;
const categories = results[0].categories;
const sexual = categories.sexual;
const hate = categories.hate;
const violence = categories.violence;
const selfharm = categories['self-harm'];
const sexualminors = categories['sexual/minors'];
const hatethreatening = categories['hate/threatening'];
const violencegraphic = categories['violence/graphic'];
console.log(sexual);
console.log(hate);
console.log(violence);
console.log(selfharm);
console.log(sexualminors);
console.log(hatethreatening);
console.log(violencegraphic);
}
run("yes");