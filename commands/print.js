const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");

exports.run = async (client, message, [whatToPrint, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;

    if(!whatToPrint){
        message.reply({ content: `Please specify what you'd like to print.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }

    logger.log(`Printing: ${whatToPrint}`)
    const stored = drafts.get(message.channel.guild.id)

    if(!stored){
        message.channel.send(`Tried to print **${whatToPrint}**, but that has not been stored!`)
        return
    }
    else if (whatToPrint === 'all'){
        message.channel.send(JSON.stringify(stored,null,4));
        return
    }
    else if (!stored?.[whatToPrint]){
        message.channel.send(`**${whatToPrint}** is not stored.`)
        return
    }
    else if (whatToPrint === 'teams'){
        const embed = {
            color: 0x990000,
            title: 'Teams',
            fields: stored.teams.map(team => ({
                name: `Team ${team.name}`,
                value: team.players.map(player => player.displayName).join('\n')
            }))
        }
        message.channel.send({ embeds: [embed] });
        return
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "print",
    category: "Team Building",
    description: "Print teams, participants, captains, etc",
    usage: "print <thing to print>"
};


