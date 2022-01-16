const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");

exports.run = async (client, message, [whatToClear, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;

    if(!whatToClear){
        message.reply({ content: `Please specify what you'd like to clear.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }

    logger.log(`Clearing: ${whatToClear}`)

    const stored = drafts.get(message.channel.guild.id)

    if(!stored){
        message.channel.send(`Nothing is currently stored been stored.`)
        return
    }
    else if(whatToClear === 'all'){
        drafts.set(message.channel.guild.id,{})
        message.channel.send(`All cleared.`)
    }
    else if (!stored?.[whatToClear]){
        message.channel.send(`**${whatToClear}** is not currently stored.`)
        return
    }
    else {
        drafts.delete(message.channel.guild.id,whatToClear)
        message.channel.send(`**${whatToClear}** cleared.`)
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Bot Owner"
};

exports.help = {
    name: "clear",
    category: "System",
    description: "Clear teams, participants, captains, etc",
    usage: "clear <thing to clear>"
};


