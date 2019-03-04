let fs = require('fs');
let filter = require('./language-filter');
let messages = JSON.parse(fs.readFileSync('small_data.json'));
let db = require('./database');

let callback = db.FilteredWord.findAll({
    attributes: ['word']
}).then(words => {
    let filteredWords = [];
    words.forEach(word => {
        filteredWords.push(word.word);
    });

    messages.ok.forEach(message => {
        console.log(`"${filter.checkMessage(message, filteredWords)}" found in ${message}`);
    });
});


