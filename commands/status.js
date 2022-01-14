const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [...values], level) => {
    const stored = drafts.get(message.channel.guild.id)

    let fields = [
        { name: "Event Name", value: stored?.eventName ? stored.eventName : "-"},
        { name: "Event Channel", value: stored?.eventChannel ? stored.eventChannel.name : "-"},
        { name: "Team Signup Message", value: stored?.captainMessage?.id ? `Posted at ${new Date(stored.captainMessage.createdAt).toLocaleString()}` : "-"},
        { name: "Player Signup Message", value: stored?.playerMessage?.id ? `Posted at ${new Date(stored.playerMessage.createdAt).toLocaleString()}` : "-"},
        { name: '\u200B', value: '\u200B' },
        { name: "All Participants", value: stored?.players?.length ? `**${stored.players.length}:** ${JSON.stringify(stored.players.map(player => player.name))}` : "-"},
        { name: "Captains", value: stored?.players?.length ? `**${stored.players.filter(player => player.role === 'captain').length}:** ${JSON.stringify(stored.players.filter(player => player.role === 'captain').map(player => player.name))}` : "-"},
        { name: "Deputies", value: stored?.players?.length ? `**${stored.players.filter(player => player.role === 'deputy').length}:** ${JSON.stringify(stored.players.filter(player => player.role === 'deputy').map(player => player.name))}` : "-"},
        { name: "Weekend Players", value: stored?.players?.length ? `**${stored.players.filter(player => player.role === 'weekendPlayer').length}:** ${JSON.stringify(stored.players.filter(player => player.role === 'weekendPlayer').map(player => player.name))}` : "-"},
        { name: "Saturday Players", value: stored?.players?.length ? `**${stored.players.filter(player => player.role === 'saturdayPlayer').length}:** ${JSON.stringify(stored.players.filter(player => player.role === 'saturdayPlayer').map(player => player.name))}` : "-"},
        { name: "Sunday Players", value: stored?.players?.length ? `**${stored.players.filter(player => player.role === 'sundayPlayer').length}:** ${JSON.stringify(stored.players.filter(player => player.role === 'sundayPlayer').map(player => player.name))}` : "-"},
    ]

    if(stored?.teams?.length){
        const teamFields = stored.teams.map(team => ({
            name: `Team ${team.name}`,
            value: team?.players?.length || team?.deputies?.length ? team.deputies.map(player => `${player.name} :police_officer:`).concat(team.players.map(player => player.name)).join('\n') : '(none)',
            inline: true
        }))
        // putting a empty row in before adding the team fields
        fields = fields.concat({ name: '\u200B', value: '\u200B' }).concat(teamFields)
    }

    await postEmbed({
        guild: message.guild,
        channel: message.channel,
        title: 'Status',
        description: `-------------------`,
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


