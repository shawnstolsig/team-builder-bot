const logger = require("../modules/Logger.js");
const { drafts } = require("../modules/enmaps");
// This event executes when a new guild (server) is joined.

module.exports = (client, guild) => {
  drafts.set(guild.id, {})
  logger.log(`[GUILD JOIN] ${guild.id} added the bot. Owner: ${guild.ownerId}`);
};
