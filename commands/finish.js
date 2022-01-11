const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const { startDraft } = require("../modules/draft");
const logger = require("../modules/Logger");

const {drafts} = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");
const {getDisplayName} = require("../modules/util");

exports.run = async (client, message, [draftEvent, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    // edge cases: bad input or no event channel set
    if(!draftEvent){
        message.reply({ content: `What do you want to finish?  Please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
    }
    else if(!stored?.eventChannel?.id){
        message.reply({ content: `Please use the **channel** command to set an event text channel first.`, allowedMentions: { repliedUser: (replying === "true") }});
    }

    // team building command: 'teams'
    else if (draftEvent === 'teams'){
         if(!stored?.captainMessage?.id){
            message.reply({ content: `You must first use the **start** command to initiate a Team Building session.`, allowedMentions: { repliedUser: (replying === "true") }});
            return
         }

         try {
             const eventChannel = await message.guild.channels.fetch(stored.eventChannel.id, {force: true})
             const captainMessage = await eventChannel.messages.fetch(stored.captainMessage.id, {force: true})

             // get collections of users for each emoji that was used to react (Members are not available from reactions, so must traverse via User unfortunately)
             const arrayOfUserCollections = await Promise.all(captainMessage.reactions.cache.map(reaction => reaction.users.fetch()))   // this resolves to an array container User collections

             // flatten out each collection of user IDs into a single array
             const reactedUserIds = []
             arrayOfUserCollections.forEach(userCollection => {
                 userCollection.forEach(user => {
                     reactedUserIds.push(user.id)
                 })
             })

             // pull the associated member for each userID who reacted
             const teamsWithDisplayNames = await Promise.all([...new Set(reactedUserIds)].map(userId => getDisplayName(message,userId)))

             // create the teams associated with each Member (who is the team captain)
             const teams = teamsWithDisplayNames.map(member => ({
                                 id: member.id,
                                 name: member.displayName,
                                 captain: {id: member.id, name: member.displayName},
                                 players: []
                             }))

             // edit/take down captainMessage
             await captainMessage.suppressEmbeds(true)
             await captainMessage.edit(`**Team registration has been completed.**  There were ${teams.length} signups!`)

             // update data storage: add teams and remove the captain message
             drafts.set(message.channel.guild.id, teams, "teams")
             drafts.delete(message.channel.guild.id, "captainMessage")

             message.reply({ content: `You've ended the team building session.  The post in **${stored.eventChannel.name}** has been edited.`, allowedMentions: { repliedUser: (replying === "true") }});
             logger.log(`Finished: Team building`)
         } catch (e) {
             logger.log(e, 'warn')
             message.channel.send('Unable to finish team building session.')
         }

    }

    // player signup command: 'players'
    else if (draftEvent === 'players'){

        if(!stored?.playerMessage?.id){
            message.reply({ content: `You must first use the **start** command to initiate a player signups.`, allowedMentions: { repliedUser: (replying === "true") }});
            return
        }

        try {
            const eventChannel = await message.guild.channels.fetch(stored.eventChannel.id, {force: true})
            const playerMessage = await eventChannel.messages.fetch(stored.playerMessage.id, {force: true})

            // get collections of users for each emoji that was used to react (Members are not available from reactions, so must traverse via User unfortunately)
            const arrayOfUserCollections = await Promise.all(playerMessage.reactions.cache.map(reaction => reaction.users.fetch()))   // this resolves to an array container User collections

            // flatten out each collection of user IDs into a single array
            const reactedUserIds = []
            arrayOfUserCollections.forEach(userCollection => {
                userCollection.forEach(user => {
                    reactedUserIds.push(user.id)
                })
            })

            // pull the associated member for each userID who reacted
            const playersWithDisplayNames = await Promise.all([...new Set(reactedUserIds)].map(userId => getDisplayName(message,userId)))

            // create the teams associated with each Member (who is the team captain)
            const players = playersWithDisplayNames.map(member => ({
                id: member.id,
                name: member.displayName,
                team: undefined
            }))

            // edit/take down playerMessage
            await playerMessage.suppressEmbeds(true)
            await playerMessage.edit(`**Player signup has been completed.**  There were ${players.length} signups!`)

            // update data storage: add players and remove the player message
            drafts.set(message.channel.guild.id, players, "players")
            drafts.delete(message.channel.guild.id, "playerMessage")

            message.reply({ content: `You've ended player signups.  The post in **${stored.eventChannel.name}** has been edited.`, allowedMentions: { repliedUser: (replying === "true") }});
            logger.log(`Finished: Player signups`)
        } catch (e) {
            logger.log(e, 'warn')
            message.channel.send('Unable to finish player signups.')
        }
    }

    // catch all error message
    else {
        message.reply({ content: `What do you want to finish?  Please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
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
    usage: "finish <teams, players, draft>"
};


