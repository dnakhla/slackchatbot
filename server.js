const config = require("./config.js");
const Botkit = require('botkit');
const _ = require('lodash');
const controller = Botkit.slackbot({
    debug: 0,
    json_file_store: '/tmp/slackbot.json'
});
const spotify = require('spotify');
var list = '';
var counter = _.map([
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
controller.hears('(.*)', ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    counter = updateCounterValue(counter, message);
    var cake = _.filter(counter, (value) => {
            return value.keyword == ":cake:";
        })
        .shift();
    if (cake.value > 1) {
        return bot.reply(message, {
            text: cake.value + " cakes",
            username: "cake count",
            icon_emoji: ":cake:",
        })
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
            .filter(popularityIs(60))
            .slice(0, 1)
            .reduce((list, result) => {
                return list + ',' + result.url.split(':')
                    .pop();
            }, '')
            .slice(1);
        if (data) {
            list += ',' + data;
        }
    });

    setInterval(function () {
        if (list.length < 1) {
            return;
        }
        var tmp = '';
        tmp = list
        list = '';
        return bot.reply(message, {
            text: "https://embed.spotify.com/?uri=spotify:trackset:roomvibes:" + tmp,
            username: "roomvibes",
            icon_emoji: ":musical_score:",
            response_type: "ephemeral",
            height: "100px"
        })
    }, 1000 * 60 * 30);
})
