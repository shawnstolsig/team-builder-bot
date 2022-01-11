const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const { startDraft } = require("../modules/draft");
const logger = require("../modules/Logger");

const {drafts} = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [draftEvent, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    // edge cases: bad input or no event channel set
    if(!draftEvent){
        message.reply({ content: `What do you want to start?  Please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
    }
    else if(!stored?.eventChannel?.id){
        message.reply({ content: `Please use the **channel** command to set an event text channel first.`, allowedMentions: { repliedUser: (replying === "true") }});
    }

    // team building command: 'teams'
    else if (draftEvent === 'teams'){
        const startMessage = await postEmbed({
            guild: message.guild,
            title: `Team Creation`,
            description: 'Team captains: React to this message to register your team for the upcoming draft!'
        })
        drafts.set(message.channel.guild.id, [], "teams")
        drafts.set(message.channel.guild.id, {id: startMessage.id, createdAt: startMessage.createdTimestamp}, "captainMessage")

        message.reply({ content: `You've started a team building session.  View your post in the **${stored.eventChannel.name}** text channel.`, allowedMentions: { repliedUser: (replying === "true") }});
        logger.log(`Started: Team building`)
    }

    // player signup command: 'players'
    else if (draftEvent === 'players'){
        const startMessage = await postEmbed({
            guild: message.guild,
            title: `Player Signup`,
            description: 'Players: Please react to this message to register yourself as a player for the upcoming draft!'
        })
        drafts.set(message.channel.guild.id, [], "players")
        drafts.set(message.channel.guild.id, {id: startMessage.id, createdAt: startMessage.createdTimestamp}, "playerMessage")

        message.reply({ content: `You've opened player signup.  View your post in the **${stored.eventChannel.name}** text channel.`, allowedMentions: { repliedUser: (replying === "true") }});
        logger.log(`Started: Player signups`)
    }

    else if (draftEvent === 'draft'){
        // CODE HERE
    }

    // catch all error message
    else {
        message.reply({ content: `What do you want to start?  Please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["begin", "init", "initiate", "s"],
    permLevel: "Administrator"
};

exports.help = {
    name: "start",
    category: "Team Building",
    description: "Starts one of the draft events.",
    usage: "start <teams, players, draft>"
};


