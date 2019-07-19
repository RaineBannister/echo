const natural = require('natural');
natural.Metaphone.attach();
const tokenizer = new natural.WordTokenizer();

class Filter {
    static checkMessage(message, wordList) {
        // TODO: add some parsing beforehand to cluster around of letters separated by s p a c e s to avoid the filter
        // or possibly other characters, such as p.e.r.i.o.d.s.
        // probably need to look at any large amount of letters separated by non letters

        // TODO: add machine learning language detection
        // this will be trained on a dataset then loaded into Echo. This will allow for Echo to determine things hinted
        // at between the lines, basically.

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