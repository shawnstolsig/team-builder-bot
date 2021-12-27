const logger = require('../modules/Logger');
const {drafts} = require("../modules/enmaps");

async function postEmbed({guild, channel, title, description, fields = [] }){
    return new Promise(async (resolve, reject) => {
        const stored = drafts.get(guild.id)

        if(!channel){
            try {
                channel = await guild.channels.fetch(stored.eventChannel.id)
            }
            catch (e) {
                logger.log(`Unable to find eventChannel in postEmbed(): ${e}`, 'error')
            }
        }

        if(stored?.eventName){
            title = `**${stored.eventName}**: ${title} `
        }

        const embed = {
            color: 0x990000,
            title,
            description: description ? description : undefined,
            fields: fields.length ? fields : undefined
        }
        try {
            const post = await channel.send({ embeds: [embed] });
            resolve(post)
        } catch (e) {
            logger.log(e, 'error')
            reject(e)
        }

    })

}

async function getAnswers(client, channel,questions){
    return new Promise(async (resolve, reject) => {

        let answers = []

        for (const question of questions) {
            await channel.send(question)
            try {
                const filter = m => !!m.content;
                const collected = await channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })

                // if message is "stop", end session
                if (END_MESSAGES.includes(collected.first().content.toLowerCase())) {
                    await channel.send("Session ended.");
                    reject("Ended by user." )
                    break
                }
                // otherwise, assuming i>0 (we want to ignore the answer to the first question, which is just 'yes' or 'no')
                else {
                    answers.push(collected.first().content)
                }
            } catch (e) {
                reject(e)
                break
            }
        }
        resolve(answers)
    })
}

module.exports = {
    getAnswers,
    postEmbed
}