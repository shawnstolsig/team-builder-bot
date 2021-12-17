const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const { startDraft } = require("../modules/draft");
const logger = require("../modules/Logger");

exports.run = async (client, message, [sessionType, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;

    // return if type of team building not specified
    if(!sessionType){
        message.reply({ content: `No team building session type specified, please try again.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }

    message.reply({ content: `You've started a ${sessionType} team building session.`, allowedMentions: { repliedUser: (replying === "true") }});
    logger.log(`Started team building session: ${sessionType}`)

    if(sessionType === 'draft'){
        await startDraft(message.channel)
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


