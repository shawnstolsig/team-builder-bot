const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, name, level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    if(name.length === 0 && !stored?.eventName){
        message.reply({ content: `Please provide the name for this event.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    } else if (name.length === 0 && stored?.eventName){
        await postEmbed({
            guild: message.guild,
            channel: message.channel,
            title: 'Event Name',
            description: `This bot is currently configured for the **${stored.eventName}** event.`
        })
        return
    }

    try {
        const eventName = name.join(' ')
        drafts.set(message.channel.guild.id, eventName, "eventName")
        await postEmbed({
            guild: message.guild,
            channel: message.channel,
            title: 'Event Name Set',
            description: `This event's name is set to **${eventName}**.`
        })
        logger.log(`Event name set: ${eventName}`)
    } catch (e) {
        logger.log(e,'warn')
        message.channel.send(`Error setting event name, please try again.`)
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "name",
    category: "Team Building",
    description: "For setting the event name.",
    usage: "name <event name>"
};


