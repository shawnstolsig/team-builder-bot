const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");

const {drafts} = require("../modules/enmaps");

exports.run = async (client, message, [playerId, role, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    // edge cases: bad input or player signup not complete
    if (!stored?.players){
        message.reply({ content: `You must complete player signup to use this command.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }
    else if(!playerId){
        message.reply({ content: `Please specify the 18-digit Discord ID of the player you want to add/modify.`, allowedMentions: { repliedUser: (replying === "true") }});
        return
    }

    // try block will fail if unable to find guild member using provided ID
    try {
        const member = await message.guild.members.fetch(playerId)
        const storedPlayer = stored.players.find(player => player.id === member.id)

        // if no role provided and the player has been signed up, then remove player
        if(!role && storedPlayer?.id){
            stored.players.splice(stored.players.findIndex(player => storedPlayer.id === player.id),1)
            drafts.set(message.channel.guild.id,stored.players,"players")
            logger.log(`Player: removed ${storedPlayer.name}`)
            message.reply({ content: `**${storedPlayer.name}** has been removed...they will not be eligible for the draft.`, allowedMentions: { repliedUser: (replying === "true") }});
        }

        // if no role provided and the player has not been signed up, then print error message
        else if(!role && !storedPlayer?.id){
            message.reply({ content: `To add **${member.displayName}**, please include their role: 'captain', 'deputy', 'weekendPlayer', 'saturdayPlayer', or 'sundayPlayer'.  Try again.`, allowedMentions: { repliedUser: (replying === "true") }});
        }

        // if role provided and the player has not been signed up, add player
        else if (role && !storedPlayer?.id){
            // for adding player
            drafts.push(
                message.channel.guild.id,
                {id: member.id, name: member.displayName, role, team: undefined},
                'players'
            )
            logger.log(`Player: added ${member.displayName} as ${role}`)
            message.reply({ content: `**${member.displayName}** has been added as **${role}**...they will be eligible for the draft!`, allowedMentions: { repliedUser: (replying === "true") }});
        }

        // if role provided and the player has been signed up, update player role
        else if (role && storedPlayer?.id){
            const oldRole = storedPlayer.role
            storedPlayer.role = role
            drafts.set(message.channel.guild.id,stored.players,"players")
            logger.log(`Player: role changed for ${storedPlayer.name} ${oldRole} -> ${role}`)
            message.reply({ content: `**${storedPlayer.name}** role has been changed from **${oldRole}** to **${role}**.`, allowedMentions: { repliedUser: (replying === "true") }});
        }

    } catch (e) {
        logger.log(e,'warn')
        message.channel.send(`Could not find user with that ID, please try again.`)
    }


};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["participant"],
    permLevel: "Administrator"
};

exports.help = {
    name: "player",
    category: "Team Building",
    description: "Admin commands for modifying the players.",
    usage: "player <18 digit Discord ID> <captain, deputy, weekendPlayer, saturdayPlayer, sundayPlayer, or none>"
};


