const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [channelId, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    if(!channelId && !stored?.eventChannel){
        message.reply({ content: `Please provide the text channel ID to be used for this event.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    } else if (!channelId && stored?.eventChannel){
        await postEmbed({
            guild: message.guild,
            channel: message.channel,
            title: 'Event Channel',
            description: `Text channel **${stored.eventChannel.name}** is currently being used for event announcements.`
        })
        return
    }

    try {
        const channel = await message.guild.channels.fetch(channelId)
        drafts.set(message.channel.guild.id, {id: channel.id, name: channel.name}, "eventChannel")
        await postEmbed({
            guild: message.guild,
            channel: message.channel,
            title: 'Event Channel Set',
            description: `Text channel **${channel.name}** is now being used for posting event announcements.`
        })
        logger.log(`Event channel set: ${channelId}`)
    } catch (e) {
        logger.log(e,'warn')
        message.channel.send(`Could not find channel with that ID, please try again.  Please ensure you are referencing the channel with the 18=digit channel ID.`)
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "channel",
    category: "Team Building",
    description: "For selecting the event's announcement channel.",
    usage: "channel <channel id>"
};


