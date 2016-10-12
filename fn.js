'use strict';
const _ = require('lodash');
const spotify = require('spotify');

var list = [];

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

function spotifyPromise(text) {
    return new Promise(function (resolve, reject) {
        spotify.search({
            type: 'track',
            query: text
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function addtoListAndEmitPlaylist(bot, message) {
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

function returnCake(counter) {
    return _.filter(counter, (value) => {
            return value.keyword == ":cake:";
        })
        .shift()
}

function getTrack(data) {
    data = _.map(data, returnTrackObject)
        .filter(popularityIs(50));
    data = _.shuffle(data.slice(0, 10))
        .slice(0, 1)
        .reduce((list, result) => list + ',' + result.url.split(':')
            .pop(), '')
        .slice(1);
    return data;
}

function handleSpotifyReturn(bot, message) {
    return function (data) {
        data = data.tracks.items || {};
        if (data.length < 1) {
            return;
        }
        data = getTrack(data);
        if (message.match[1].charAt(message.match[1].length - 1) == '!' && data) {
            replytoChannel(bot, message, message.channel, "https://open.spotify.com/track/" + data);
        } else if (data) {
            list[message.channel] = list[message.channel] || [];
            list[message.channel].push(data);
            list[message.channel] = _.uniq(list[message.channel]);
        }
    }
}

module.exports = {
    _: _,
    messageMatchValue: messageMatchValue,
    updateCounterValue: updateCounterValue,
    returnTrackObject: returnTrackObject,
    popularityIs: popularityIs,
    cakeReply: cakeReply,
    replytoChannel: replytoChannel,
    spotifyPromise: spotifyPromise,
    addtoListAndEmitPlaylist: addtoListAndEmitPlaylist,
    returnCake: returnCake,
    getTrack: getTrack,
    handleSpotifyReturn: handleSpotifyReturn
}
