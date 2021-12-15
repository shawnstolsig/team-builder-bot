const END_MESSAGES = ['stop','no','end']

async function getAnswers(client, channel,questions){
    return new Promise(async (resolve, reject) => {

        const filter = m => !!m.content;
        let answers = []

        for (const question of questions) {
            await channel.send(question)
            try {
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
}