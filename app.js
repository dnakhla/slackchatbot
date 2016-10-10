const config = require("./config.js");
const Botkit = require('botkit');
const _ = require('lodash');
const controller = Botkit.slackbot({
    debug: 0,
    json_file_store: '/tmp/slackbot.json'
});
const spotify = require('spotify');
var list = [];
let counter = _.map([
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

function messageMatchValue(haystack, needle) {
    return ((haystack.match[1].toLowerCase())
        .indexOf(_.toString(needle.keyword)
            .toLowerCase()) > -1 ||
        _.toString(haystack.match[1]) === _.toString(needle.keyword));
}

function updateCounterValue(counter, message) {
    return _.mapValues(counter, (value) => {
        if (messageMatchValue(message, value)) {
            value.value++;
        }
        return value;
    });
}

function returnTrackObject(result) {
    if (!!result)
        return {
            name: result.name,
            url: result.uri,
            popularity: result.popularity,
        }
}

function popularityIs(limit) {
    return function (result) {
        return result.popularity > limit
    }
}

function cakeReply(bot, message, text) {
    bot.reply(message, {
        text: text,
        username: "cake count",
        icon_emoji: ":cake:",
    })
}

function replytoChannel(bot, message, chan, text) {
    bot.reply(message, {
        text: text,
        username: "roomvibes",
        icon_emoji: ":musical_score:",
        response_type: "ephemeral",
        height: "100px",
        channel: chan
    });
}

function runTimer(bot, message) {
    var chan = message.channel;
    list[chan] = list[chan] || [];
    if (list[chan].length > 8) {
        replytoChannel(bot, message, chan, (10 - list[chan].length) + " more songs to finishing playlist");
    }
    console.log("list:", list[chan]);
    if (list[chan].length < 10) {
        return;
    }
    var tmp = _.clone(list[chan]);
    list[chan] = [];
    replytoChannel(bot, message, chan, "https://embed.spotify.com/?uri=spotify:trackset:roomvibes:" + tmp.join(','));
}
controller.hears('(.*)', ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    counter = updateCounterValue(counter, message);
    runTimer(bot, message);
    let cake = _.filter(counter, (value) => {
            return value.keyword == ":cake:";
        })
        .shift();
    if (message.match[1].indexOf(cake.keyword) > -1) {
        cakeReply(bot, message, cake.value + " cakes");
    }
    spotify.search({
        type: 'track',
        query: message.text
    }, function (err, data) {
        if (err) {
            console.log('Error occurred: ' + err);
            return;
        }
        var data = data.tracks.items || {};
        if (data.length < 1) {
            return;
        }

        data = _.map(data, returnTrackObject)
            .filter(popularityIs(50))
            .slice(0, 1)
            .reduce((list, result) => list + ',' + result.url.split(':')
                .pop(), '')
            .slice(1);

        if (message.match[1].charAt(message.match[1].length - 1) == '!') {
            replytoChannel(bot, message, message.channel, "https://open.spotify.com/track/" + data);
        } else
        if (data) {
            list[message.channel] = list[message.channel] || [];
            list[message.channel].push(data);
            list[message.channel] = _.uniq(list[message.channel]);
        }
    });


})
