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
    else if(!stored?.eventChannel){
        message.reply({ content: `Please use the **channel** command to set an event text channel first.`, allowedMentions: { repliedUser: (replying === "true") }});
    }

    // team building command: 'teams'
    else if (draftEvent === 'teams'){
        logger.log(`Started: ${draftEvent}`)

        message.reply({ content: `You've started a team building session.  View your post in the **${stored.eventChannel.name}** text channel.`, allowedMentions: { repliedUser: (replying === "true") }});

        const startMessage = await postEmbed({
            guild: message.guild,
            title: `Team Creation`,
            description: 'Team captains: React to this message to register your team for the upcoming draft!'
        })
        drafts.set(message.channel.guild.id, {
            ...stored,
            captainMessage: startMessage
        })
    }

    // catch all error message
    else {
        message.reply({ content: `What do you want to start?  Please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "User"
};

exports.help = {
    name: "start",
    category: "Team Building",
    description: "Starts the process of building teams.",
    usage: "start <type of teams>"
};


