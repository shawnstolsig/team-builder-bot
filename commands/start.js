const config = require("../config.js");
const {settings} = require("../modules/settings.js");
const {startDraft, getEmoji} = require("../modules/draft");
const logger = require("../modules/Logger");

const {END_MESSAGES} = require("../modules/constants");
const {drafts} = require("../modules/enmaps");
const {postEmbed} = require("../modules/messaging");

exports.run = async (client, message, [draftEvent, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;
    const stored = drafts.get(message.channel.guild.id)

    // edge cases: bad input or no event channel set
    if (!draftEvent) {
        message.reply({
            content: `What do you want to start?  Please try again.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    } else if (!stored?.eventChannel?.id) {
        message.reply({
            content: `Please use the **channel** command to set an event text channel first.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    }

    // team building command: 'teams'
    else if (draftEvent === 'teams') {
        logger.log(`Started: Team building`)

        // abort if player signup hasn't started
        if (!stored?.players?.length) {
            message.reply({
                content: `Unable to create teams...player signup is not yet complete!`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            return
        }

        // get all players who registered to be a captain
        const signedUpCaptains = stored.players.filter(player => player.role === 'captain')

        // admins will select captains using comma separated index value
        await postEmbed({
            guild: message.guild,
            channel: message.channel,
            title: `Team Creation - Started`,
            description: `Respond with each captain's number, separated by commas, to specify which captains will get a team.\n\n*Bot will only respond to input from **${message.member.displayName}**.*\n\n${signedUpCaptains.map((player, i) => `**#${i + 1}:** ${player.name}`).join('\n')}`,
        })

        try {
            // only respond to the admin who ran the 'start teams' command
            const filter = m => m.author === message.author;
            const collected = await message.channel.awaitMessages({filter, max: 1, time: 60000, errors: ['time']})

            // split out response into an array
            const selectedCaptainIds = collected.first().content.split(",")

            // get a team list, based on user input index values
            const teams = selectedCaptainIds.map(id => {
                const captain = signedUpCaptains.find((player, i) => i == id - 1)
                if (!captain) return false;
                return {
                    id: captain.id,
                    name: captain.name,
                    captain,
                    deputies: [],
                    players: []
                }
            })

            // demote the non-selected captains to Deputy
            const notSelectedCaptains = signedUpCaptains.filter(player => !teams.map(team => team.captain.id).includes(player.id))
            notSelectedCaptains.forEach(captain => {
                const p = stored.players.find(player => player.id === captain.id)
                p.role = 'deputy'
            })

            // update the selected captain teams
            stored.players.filter(player => player.role === 'captain').forEach(captain => {
                captain.team = captain.id
            })

            // post result message
            await postEmbed({
                guild: message.guild,
                channel: message.channel,
                title: `Team Creation - Completed`,
                description: `Results:`,
                fields: [
                    {
                        name: "Confirmed Teams :white_check_mark::",
                        value: teams.length ? teams.map(team => team.name).join('\n') : '(none)',
                        inline: true
                    },
                    {
                        name: "Converted to Deputy :arrow_double_down::",
                        value: notSelectedCaptains.length ? notSelectedCaptains.map(player => player.name).join('\n') : '(none)',
                        inline: true
                    },
                ]
            })
            logger.log(`Completed: Team building, starting deputy selection`)

            // deputy selection
            await postEmbed({
                guild: message.guild,
                channel: message.channel,
                title: `Deputy Selection`,
                description: `The following players signed up as Deputy, or were Team Captains who weren't given a team...we will now assign Deputies to each team.\n\n*Bot will only respond to input from **${message.member.displayName}**.*\n\n${stored.players.filter(p => p.role === 'deputy').map((player, i) => `**(${i + 1})** ${player.name}`).join('\n')}`,
            })

            // iterate through teams
            for (let team of teams) {
                message.channel.send(`Please specify deputies for team: **${team.name}**`)
                try {
                    // only respond to the admin who ran the 'start teams' command
                    const filter = m => m.author.id.toString() === message.author.id.toString();
                    const depCollected = await message.channel.awaitMessages({
                        filter,
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    })

                    // split out response into an array
                    const selectedDeputyIndexes = depCollected.first().content.split(",")

                    // get a team list, based on user input index values
                    const teamDeputies = selectedDeputyIndexes.map(index => {
                        const deputy = stored.players.filter(p => p.role === 'deputy')[index - 1]
                        if (!deputy) return false;
                        deputy.team = team.id
                        return deputy
                    }).filter(d => d)

                    // add selection list of deputies to the team
                    team.deputies = teamDeputies

                    message.channel.send(`**${team.name} deputies:**  ${teamDeputies.map(d => d.name)}`)
                } catch (err) {
                    logger.log(err, 'warn')
                    message.channel.send(`Deputy selection aborted/timed out.`)
                }
            }

            // deputy selection
            await postEmbed({
                guild: message.guild,
                channel: message.channel,
                title: `Team and Deputy Selection - Complete`,
                description: `-------------------------------`,
                fields: [
                    {
                        name: "Converted to Weekend Players :arrow_double_down::",
                        value: stored.players.filter(p => p.role === 'deputy' && !p.team).length ? stored.players.filter(p => p.role === 'deputy' && !p.team).map(player => player.name).join('\n') : '(none)',
                    }
                ].concat(
                    teams.map(team => ({
                        name: `Team ${team.name}`,
                        value: team?.deputies?.length ? team.deputies.map(player => `${getEmoji(player.role)} ${player.name}`).join('\n') : '(none)',
                        inline: true
                    })))
            })

            // convert non-selected deputies to weekendPlayers
            stored.players.filter(p => p.role === 'deputy' && !p.team).forEach(p => p.role = 'weekendPlayer')

            // post both players and teams to enmap/db
            drafts.set(message.channel.guild.id, teams, "teams")
            drafts.set(message.channel.guild.id, stored.players, "players")

            // success message
            logger.log(`Completed: Team building and deputy selection`)
            console.log(JSON.stringify(drafts.get(message.channel.id), null, 4))

        } catch (e) {
            logger.log(e, 'warn')
            message.channel.send(`Team creation aborted/timed out.`)
        }

    }

    // player signup command: 'players'
    else if (draftEvent === 'players') {
        const responseMessage = await message.reply({
            content: `Posting player signup message...`,
            allowedMentions: {repliedUser: (replying === "true")}
        });

        // post a message that members will react to, based on their desired participation role
        const startMessage = await postEmbed({
            guild: message.guild,
            title: `Player Signup`,
            // description: "**Please react to this message if you'd to participate!**\n\n**Note:** *Team Captains and Deputies should be available to participate on both days of the competition.*",
            description: "**Please react to this message if you'd to participate!**",
            fields: [
                // { name: '\u200B', value: '\u200B' },
                {name: 'Team Captain', value: ":crown:", inline: true},
                {name: 'Deputy', value: ":police_officer:", inline: true},
                {
                    name: 'Player',
                    value: ":two: - Both days\n:regional_indicator_s: - Saturday only\n:regional_indicator_u: - Sunday only",
                    inline: true
                },
            ]
        })

        // add the emoji so that it's easy for people to respond
        await startMessage.react('👑')
        await startMessage.react('👮')
        await startMessage.react('2️⃣')
        await startMessage.react('🇸')
        await startMessage.react('🇺')

        // update db/enmap
        drafts.set(message.channel.guild.id, [], "players")
        drafts.set(message.channel.guild.id, {
            id: startMessage.id,
            createdAt: startMessage.createdTimestamp
        }, "playerMessage")

        responseMessage.edit({
            content: `You've opened player signup.  View your post in the **${stored.eventChannel.name}** text channel.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
        logger.log(`Started: Player signups`)
    } else if (draftEvent === 'draft') {
        // abort if teams haven't been created signup hasn't started
        if (!stored?.teams?.length) {
            message.reply({
                content: `Unable to start draft...teams haven't been created yet!`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            return
        }

        // abort if not enough players
        if (!stored?.players?.length > 1) {
            message.reply({
                content: `Unable to create teams...not enough players!`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            return
        }
        // abort if not enough teams
        else if (!stored?.teams?.length > 1) {
            message.reply({
                content: `Unable to create teams...not enough teams!`,
                allowedMentions: {repliedUser: (replying === "true")}
            });
            return
        }

        // post message to confirm draft started
        const responseMessage = await message.reply({
            content: `Starting draft....`,
            allowedMentions: {repliedUser: (replying === "true")}
        })

        // start the draft
        startDraft(message)

        // Update the command response message
        responseMessage.edit({
            content: `You've started the draft, head on over to **${stored.eventChannel.name}** text channel!`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    }

    // catch all error message
    else {
        message.reply({
            content: `What do you want to start?  Please try again.`,
            allowedMentions: {repliedUser: (replying === "true")}
        });
    }

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["begin", "init", "initiate", "s"],
    permLevel: "Administrator"
};

exports.help = {
    name: "start",
    category: "Team Building",
    description: "Starts one of the draft events.",
    usage: "start <teams, players, draft>"
};


