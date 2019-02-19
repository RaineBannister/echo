const natural = require('natural');
natural.Metaphone.attach();
const tokenizer = new natural.WordTokenizer();

class Filter {
    static checkMessage(message, wordList) {
        message = message.replace(/[\.\_\*]/g, '');
        let words = tokenizer.tokenize(message);

        let filteredWords = [];

        // this checks for words that sound like bad words
        words.forEach(word => {
            wordList.forEach(wordListItem => {
                if(natural.PorterStemmer.stem(word).soundsLike(natural.PorterStemmer.stem(wordListItem))) {
                    filteredWords.push([word, wordListItem]);
                }
            });
        });

        if(filteredWords.length === 0) return false;
        else return filteredWords;
    }
}

module.exports = Filter;