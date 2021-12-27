const {getAnswers, postEmbed} = require("../modules/messaging");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");
const { END_MESSAGES } = require("../modules/constants");

async function startDraft(channel){

    let teams
    try {
        teams = await createTeams(channel)
        await channel.send(`Team building complete, teams created: ${teams.length}`)
        logger.log(`Team building complete, teams created: ${teams.length}`)
    } catch (err) {
        await channel.send(err)
        return
    }

    //PICKUP HERE: participants?
    drafts.set(channel.guild.id, {teams})
    const stored = drafts.get(channel.guild.id)
    logger.log(stored.teams.map(team => `${team.name}: Captain ${team.captain.displayName}\n`))
}

function createTeams(channel) {
    return new Promise(async (resolve, reject) => {
        await channel.send(`Team captains, please respond one at a time to register a team.  Anyone can type "stop" to end this process.`)

        let teams = []
        let teamBuildingInProgress = true

        while(teamBuildingInProgress){

            try {
                const filter = m => !!m.content;
                const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })

                // end team building if stop message received
                if (END_MESSAGES.includes(collected.first().content.toLowerCase())) {
                    await channel.send("Done making teams!");
                    teamBuildingInProgress = false
                }
                // else create team
                else {
                    const res = collected.first()
                    teams.push({
                        captain: res.member,
                        name:  res.member.displayName,
                        players: [res.member]
                    })
                    await channel.send(`Team ${res.member.displayName} created!`)
                }
            } catch (err) {
                teamBuildingInProgress = false
                const msg = "Error creating teams, aborting."
                logger.log(msg, 'warn')
                reject(msg)
            }

        }

        resolve(teams)
    })

}

module.exports = {
    startDraft
}