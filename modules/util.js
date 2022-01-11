const logger = require('../modules/Logger')

async function getDisplayName(message, userId){
    return new Promise(async (resolve, reject) => {
        try{
            const member = await message.guild.members.fetch(userId)
            resolve({id: userId, displayName: member.displayName})
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    getDisplayName
};