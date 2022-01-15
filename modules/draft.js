const {getAnswers, postEmbed} = require("../modules/messaging");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const { END_MESSAGES } = require("../modules/constants");

async function startDraft(message){
    const stored = drafts.get(message.channel.guild.id)
    const eventChannel = await message.guild.channels.fetch(stored.eventChannel.id)

    logger.log(`Draft Starting, data dump:`)
    console.log(JSON.stringify(stored,null,4))

    let captains = stored.teams.map(team => team.captain)
    let teams = stored.teams
    let players = stored.players.filter(p => p.role !== 'captain')
    const rounds = Math.ceil(players.length / captains.length)

    // post start message
    await postEmbed({
        guild: message.guild,
        title: `Draft Start`,
        description: `**How it works:**\nDuring each round of the draft, each team captain will select one player.  Team captains will select players in a randomized, from a randomized list of players.  Players with the same availability will be grouped together during each round of the draft.  The draft will conclude once all players have been assigned a team.\n\n**There will be ${rounds} rounds!**\n\n**Team Captains:**\n${captains.map(player => player.name).join('\n')}`
    })

    for(let i = 1; i <= rounds; i++ ){

        // shuffle team order and non-chosen players, then slice of the first n as the picks for the round
        teams = shuffle(teams)
        let picks = shuffle(players.filter(p => !p.team)).slice(0,teams.length)

        // TODO: Group participants of the same role during each round of drafts (add wildcard round?)
        // TODO: Prevent selection of the same player
        // TODO: Handle invalid captain input (get skipped)
        // TODO: Automatically assign last player in each round?
        // TODO: Add mentions to captains when it's their turn to select
        // TODO: Add admin commands for changing player role
        // TODO: Update admin commands in general?  Change player team?
        // TODO: Update captain selection with player name
        // TODO: Handle when number of players doesn't divide evenly into teams
        // TODO: Update roundMessage when player is picked
        // TODO: How to handle if bot crashes mid-draft??

        // round start message, shows picking order and available picks
        const roundMessage = await postEmbed({
            guild: message.guild,
            title: `Round #${i}`,
            description: `**Available Picks:**\n${picks.map((player,index) => `(${index+1}) -${player.name}`).join('\n')}`,
            fields: [
                {
                    name: `Selection order:`,
                    value: teams.map((team, index) => `#${index+1} -${team.name}`).join('\n')
                }
            ]
        })

        // iterate through teams
        for(let team of teams){
            try {

                // prompt captain for selection
                await eventChannel.send(`**Round #${i}**: ${team.name}, please make a selection.  Remaining options:\n${picks.filter(player => !player.team).map((pick,i) => `(${i + 1}) ${pick.name}`).join('\n')}`)

                let loop = true
                while(loop){
                    // only respond to the team captain
                    const filter = m => m.author.id.toString() === team.id.toString();
                    const collected = await eventChannel.awaitMessages({ filter, max: 1, time: 10000, errors: ['time'] })

                    // get response
                    const selectionIndex = collected.first().content

                    // abort if bad input
                    if(!picks.map((player, i) => i + 1).includes(Number(selectionIndex))){
                        await eventChannel.send(`Bad input!  Must be a number between 1 and ${picks.length}.  Pick again.`)
                        continue
                    }
                    else {
                        const selectedPlayer = picks[selectionIndex - 1]

                        if(selectedPlayer.team) {
                            await eventChannel.send(`**${selectedPlayer.name}** has already been selected!  Pick again.`)
                            continue
                        }
                        else {
                            // stop looping for this player since we have a valid pick
                            loop = false

                            // update the selected player with their new team id
                            stored.players.find(player => player.id === selectedPlayer.id).team = team.id
                            players.find(player => player.id === selectedPlayer.id).team = team.id
                            picks[selectionIndex - 1].team = team.id

                            // update the team player (or deputy) array
                            if(selectedPlayer.role === 'deputy'){
                                teams.find(t => team.id === t.id).deputies.push(selectedPlayer)
                            } else {
                                teams.find(t => team.id === t.id).players.push(selectedPlayer)
                            }
                        }
                    }
                }
            } catch (e) {
                logger.log(e.message,'warn')
                await eventChannel.send(`**An error has occured, the draft has been cancelled.** `)
                await message.channel.send(`Draft aborted/timed out....no data was saved, please try again.`)
                return
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
            value: team.deputies.map(player => `${player.name} :police_officer:`).concat(team.players.map(player => player.name)).join('\n'),
            inline: true
        }))
    })
}

// Uses Fisher-Yates algo to shuffle array
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

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
//
// function createTeams(channel) {
//     return new Promise(async (resolve, reject) => {
//         await channel.send(`Team captains, please respond one at a time to register a team.  Anyone can type "stop" to end this process.`)
//
//         let teams = []
//         let teamBuildingInProgress = true
//
//         while(teamBuildingInProgress){
//
//             try {
//                 const filter = m => !!m.content;
//                 const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
//
//                 // end team building if stop message received
//                 if (END_MESSAGES.includes(collected.first().content.toLowerCase())) {
//                     await channel.send("Done making teams!");
//                     teamBuildingInProgress = false
//                 }
//                 // else create team
//                 else {
//                     const res = collected.first()
//                     teams.push({
//                         captain: res.member,
//                         name:  res.member.displayName,
//                         players: [res.member]
//                     })
//                     await channel.send(`Team ${res.member.displayName} created!`)
//                 }
//             } catch (err) {
//                 teamBuildingInProgress = false
//                 const msg = "Error creating teams, aborting."
//                 logger.log(msg, 'warn')
//                 reject(msg)
//             }
//
//         }
//
//         resolve(teams)
//     })
//
// }

module.exports = {
    startDraft
}