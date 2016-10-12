const config = require("./config.js");
const fn = require("./fn.js");
const Botkit = require('botkit');
const controller = Botkit.slackbot({
    debug: 0,
    json_file_store: '/tmp/slackbot.json'
});

let counter = fn._.map([
    'going home',
    ':cake:',
    ':grinning:',
    'we did it!',
    'alright',
    ':slightly_smiling_face:'
], function (value) {
    return {
        keyword: value,
        value: 0
    };
});

// connect the bot to a stream of messages
controller.spawn({
        token: config.key
    })
    .startRTM();

controller.hears('(.*)', ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    counter = fn.updateCounterValue(counter, message);
    let textSearch = message.match[1].charAt(message.match[1].length - 1) == '!' ? message.text.slice(0, -1) : message.text;
    let cake = fn.returnCake(counter);
    if (message.match[1].indexOf(cake.keyword) > -1) {
        fn.cakeReply(bot, message, cake.value + " cakes");
    }
    fn.addtoListAndEmitPlaylist(bot, message);
    fn.spotifyPromise(textSearch)
        .then(fn.handleSpotifyReturn(bot, message));
});
