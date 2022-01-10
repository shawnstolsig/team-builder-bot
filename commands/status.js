const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [...values], level) => {
    const stored = drafts.get(message.channel.guild.id)

    const fields = [
        { name: "Event Name", value: stored?.eventName ? stored.eventName : "-"},
        { name: "Event Channel", value: stored?.eventChannel ? stored.eventChannel.name : "-"},
        { name: "Teams", value: stored?.teams?.length ? JSON.stringify(stored.teams.map(team => team.name)) : "-"},
        { name: "Players", value: stored?.players?.length ? `**${stored.players.length}:** ${JSON.stringify(stored.players.map(player => player.name))}` : "-"},
        { name: "Team Signup Message", value: stored?.captainMessage?.id ? `Posted at ${new Date(stored.captainMessage.createdAt).toLocaleString()}` : "-"},
        { name: "Player Signup Message", value: stored?.playerMessage?.id ? `Posted at ${new Date(stored.playerMessage.createdAt)}` : "-"},
    ]

    await postEmbed({
        guild: message.guild,
        channel: message.channel,
        title: 'Status',
        description: `Here's the situation:`,
        fields,
    })
    logger.log(`Status check by ${message.member.displayName}`)

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "status",
    category: "Team Building",
    description: "For checking overall status.",
    usage: "status"
};


