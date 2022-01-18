const {getAnswers, postEmbed} = require("../modules/messaging");
const logger = require("../modules/Logger");
const {drafts} = require("../modules/enmaps");
const {END_MESSAGES} = require("../modules/constants");

function getEmoji(role){
    if (role === 'captain') return '👑';
    else if (role === 'deputy') return '👮';
    else if (role === 'weekendPlayer') return '2️⃣';
    else if (role === 'saturdayPlayer') return '🇸';
    else if (role === 'sundayPlayer') return '🇺';
}

async function startDraft(message) {
    const stored = drafts.get(message.channel.guild.id)
    const eventChannel = await message.guild.channels.fetch(stored.eventChannel.id)

    logger.log(`Draft Starting, data dump:`)
    console.log(JSON.stringify(stored, null, 4))

    let captains = stored.teams.map(team => team.captain)
    let players = stored.players.filter(p => p.role !== 'captain')
    const rounds = Math.ceil(players.filter(p => !p.team).length / captains.length)

    // post start message
    await postEmbed({
        guild: message.guild,
        title: `Draft Start`,
        description: `**How it works:**\nDuring each round of the draft, each team captain will select one player.  Team captains will select players in a randomized, from a randomized list of players.  Players with the same availability will be grouped together during each round of the draft.  The draft will conclude once all players have been assigned a team.\n\n**There will be ${rounds} rounds!**\n\n**Team Captains:**\n${captains.map(player => player.name).join('\n')}`
    })

    // loop through each round
    for (let i = 1; i <= rounds; i++) {

        // shuffle team order and non-chosen players, then slice of the first n as the picks for the round
        let teams = shuffle([...stored.teams])
        const order = { deputy: 1, weekendPlayer: 2, saturdayPlayer: 3, sundayPlayer: 5 }
        let picks = shuffle(players.filter(p => !p.team).sort((a,b) => order[a.role] - order[b.role]).slice(0, teams.length))

        // round start message, shows picking order and available picks
        const roundMessage = await postEmbed({
            guild: message.guild,
            title: `Round #${i}`,
            description: `**Available Picks:**\n${picks.map((player, index) => `${getEmoji(player.role)} (${index + 1}) - ${player.name}`).join('\n')}`,
            fields: [
                {
                    name: `Selection order:`,
                    value: teams.map((team, index) => `#${index + 1} -${team.name}`).join('\n')
                }
            ]
        })

        // iterate through teams...note the teams will be removed as they make valid selections.
        // using while loop so that teams can be infinitely re-ordered for failing to make valid pick
        while(teams.length){
            let team = teams[0]

            // fetch captain's Member so that they can be mentioned
            const captain = await message.guild.members.fetch(team.captain.id)

            // prompt captain for selection
            await eventChannel.send(`**Round #${i}**: ${captain.user.toString()}, please make a selection.  Remaining options:\n${picks.map((pick, i) => pick.team ? `${getEmoji(pick.role)} ~~(${i + 1}) ${pick.name}~~` : `${getEmoji(pick.role)} (${i + 1}) ${pick.name}`).join('\n')}`)

            // while looping message collector to handle bad input
            let loop = true
            while (loop) {

                // error will be thrown if message collector times out
                try {

                    // only respond to the team captain
                    const filter = m => m.author.id.toString() === team.id.toString();
                    const collected = await eventChannel.awaitMessages({filter, max: 1, time: 30000, errors: ['time']})

                    // get response
                    const selectionIndex = collected.first().content

                    // handle message to break out from draft
                    if (END_MESSAGES.includes(collected.first().content.toLowerCase())) {
                        await eventChannel.send("The draft has been cancelled.");
                        loop = false
                        return
                    }

                    // abort if bad input
                    if (!picks.map((player, i) => i + 1).includes(Number(selectionIndex))) {
                        await eventChannel.send(`Bad input!  Must be a number between 1 and ${picks.length}.  Pick again.`)
                        continue
                    }

                    // valid player has been picked, proceed...
                    else {

                        // get the player
                        const selectedPlayer = picks[selectionIndex - 1]

                        // if player is already been chosen that round, bump that team captain to last pick
                        if (selectedPlayer.team) {
                            await eventChannel.send(`**${selectedPlayer.name}** has already been selected!  You've been moved to last pick for this round. `)
                            const skipped = teams.shift()
                            teams.push(skipped)
                            loop = false
                            continue
                        }

                        // if we have a valid player picked...
                        else {
                            // update the selected player with their new team id
                            stored.players.find(player => player.id === selectedPlayer.id).team = team.id
                            players.find(player => player.id === selectedPlayer.id).team = team.id
                            picks[selectionIndex - 1].team = team.id

                            // update the team player (or deputy) array
                            if (selectedPlayer.role === 'deputy') {
                                stored.teams.find(t => team.id === t.id).deputies.push(selectedPlayer)
                            } else {
                                stored.teams.find(t => team.id === t.id).players.push(selectedPlayer)
                            }

                            // stop looping for this player since we have a valid pick
                            loop = false
                            teams.shift()

                            // end round/draft if no more players available
                            if(!stored.players.find(player => !player.team)) teams = [];

                        }
                    }

                }
                // this catch occurs when message collector times out.  move captain to last pick of the round.
                catch (e) {
                    await eventChannel.send(`**${team.name}** took too long, they are now picking last this round. `)
                    const skipped = teams.shift()
                    teams.push(skipped)
                    loop = false
                }

            }
        }
    }

    // store updated teams and players
    drafts.set(message.guild.id, stored.teams, "teams")
    drafts.set(message.guild.id, stored.players, "players")

    // post teams at end
    await postEmbed({
        guild: message.guild,
        title: `Draft Results`,
        description: `-------------------`,
        fields: stored.teams.map(team => ({
            name: `Team ${team.name}`,
            value: team.deputies.map(player => `${getEmoji(player.role)} ${player.name}`).concat(team.players.map(player => `${getEmoji(player.role)} ${player.name}`)).join('\n'),
            inline: true
        }))
    })
}

// Uses Fisher-Yates algo to shuffle array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

module.exports = {
    startDraft,
    getEmoji
}