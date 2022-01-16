const config = require("../config.js");
const {settings} = require("../modules/settings.js");
const {startDraft} = require("../modules/draft");
const logger = require("../modules/Logger");

const {drafts} = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");
const {getDisplayName} = require("../modules/util");

exports.run = async (client, message, [draftEvent, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    // edge cases: bad input or no event channel set
    if (!draftEvent) {
        message.reply({
            content: `What do you want to finish?  Please try again.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    } else if (!stored?.eventChannel?.id) {
        message.reply({
            content: `Please use the **channel** command to set an event text channel first.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    }

    // player signup command: 'players'
    else if (draftEvent === 'players') {

        // abort if signup was never started
        if (!stored?.playerMessage?.id) {
            message.reply({
                content: `You must first use the **start** command to initiate a player signups.`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            return
        }

        const responseMessage = await message.reply({
            content: `Ending player signup....`,
            allowedMentions: {repliedUser: (replying === "true")}
        })

        try {
            const eventChannel = await message.guild.channels.fetch(stored.eventChannel.id, {force: true})
            const playerMessage = await eventChannel.messages.fetch(stored.playerMessage.id, {force: true})

            // iterate through each of the recognized emoji reactions
            const players = await Promise.all(['👑', '👮', '2️⃣', '🇸', '🇺'].map(async emoji => {

                // get user id's
                const reaction = playerMessage.reactions.cache.find(reaction => emoji === reaction.emoji.name)
                const players = await reaction.users.fetch()
                const playerIds = players.map(user => user.id)

                // pull the associated member for each userID who reacted
                const playersWithDisplayNames = await Promise.all(
                    [...new Set(playerIds)].filter(userId => userId !== '915121292171173888').map(userId => getDisplayName(message, userId))
                )

                // figure out the role based on emoji
                let role
                if (emoji === '👑') role = 'captain';
                else if (emoji === '👮') role = 'deputy';
                else if (emoji === '2️⃣') role = 'weekendPlayer';
                else if (emoji === '🇸') role = 'saturdayPlayer';
                else if (emoji === '🇺') role = 'sundayPlayer';

                // assign roles
                playersWithDisplayNames.forEach(player => {
                    player.role = role
                    player.team = role === 'captain' ? player.id : undefined
                })

                // return players (note, this will need to be flattened since it's currently 2D array by emoji)
                return playersWithDisplayNames.map(member => ({
                    id: member.id,
                    name: member.displayName,
                    role,
                    team: undefined
                }))
            }))

            // remove duplicate players, working in order of the emoji (captain -> sundayOnly)
            const allPlayers = players.flat()
            for(let i = 0; i < allPlayers.length; i++){
                for(let j = allPlayers.length - 1; j > i; j--){
                    if(allPlayers[i].id === allPlayers[j].id){
                        allPlayers.splice(j,1)
                    }
                }
            }

            // edit/take down playerMessage
            await playerMessage.suppressEmbeds(true)
            await playerMessage.edit(`**Player signup has been completed.**  There were ${allPlayers.length} signups!`)

            // update data storage: add players and remove the player message
            drafts.set(message.channel.guild.id, allPlayers, "players")
            drafts.delete(message.channel.guild.id, "playerMessage")

            await responseMessage.edit({
                content: `You've ended player signups.  The post in **${stored.eventChannel.name}** has been edited.  There were ${allPlayers.length} signups!`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            logger.log(`Finished: Player signups`)
        } catch (e) {
            logger.log(e, 'warn')
            message.channel.send('Unable to finish player signups.')
        }
    }

    // catch all error message
    else {
        message.reply({
            content: `What do you want to finish?  Please try again.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["complete", "end", "f", "stop"],
    permLevel: "Administrator"
};

exports.help = {
    name: "finish",
    category: "Team Building",
    description: "Finishes one of the draft events.",
    usage: "finish <players>"
};


