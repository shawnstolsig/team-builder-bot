const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [thingToAdd, userId, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    const validInput = thingToAdd && userId

    if(!validInput){
        message.reply({ content: `Please specify what you are trying to add (team/player) and their 18-digit Discord user ID.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }

    try {
        const member = await message.guild.members.fetch(userId)

        if(thingToAdd === 'team'){
            if (!stored.teams){
                message.reply({ content: `You must have started building teams to use the add team command.`, allowedMentions: { repliedUser: (replying === "true") }});
                return
            }

            drafts.push(
                message.channel.guild.id,
                {
                    id: member.id,
                    name: member.displayName,
                    captain: {id: member.id, name: member.displayName},
                    players: []
                },
                'teams'
            )
            await postEmbed({
                guild: message.guild,
                channel: message.channel,
                title: 'Team Added',
                description: `Added Team **${member.displayName}**.`
            })
            logger.log(`Team added: ${member.displayName}`)
        }

        else if (thingToAdd === 'player'){
            if (!stored.players){
                message.reply({ content: `You must have started player signup to use the add player command.`, allowedMentions: { repliedUser: (replying === "true") }});
                return
            }
            drafts.push(
                message.channel.guild.id,
                {id: member.id, name: member.displayName, team: undefined},
                'players'
            )
            await postEmbed({
                guild: message.guild,
                channel: message.channel,
                title: 'Player Added',
                description: `Added player **${member.displayName}**.`
            })
            logger.log(`Player added: ${member.displayName}`)

        }


    } catch (e) {
        logger.log(e,'warn')
        message.channel.send(`Could not find user with that ID, please try again.`)
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "add",
    category: "Team Building",
    description: "For manually adding teams and players.",
    usage: "add <what to add> <18 digit Discord ID of user>"
};


