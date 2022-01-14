const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");

exports.run = async (client, message, [...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;

    const responseMessage = await message.reply({ content: `Seeding...`, allowedMentions: { repliedUser: (replying === "true") }});

    // clear the event channel
    const eventChannel = await message.guild.channels.fetch("924907526179418112")
    const messages = await eventChannel.messages.fetch({ limit: 100}).then(msgs => msgs.first(msgs.size))
    await Promise.all(messages.map(msg => msg.delete()))

    drafts.set(message.guild.id,{
        "eventChannel": {
            "id": "924907526179418112",
            "name": "event"
        },
        "eventName": "Champion of Kill Steal",
        "players": [
            {
                "id": "205547921029070849",
                "name": "mb67",
                "role": "captain",
                "team": "205547921029070849"
            },
            {
                "id": "915121292171173888",
                "name": "CoKS",
                "role": "weekendPlayer",
                "team": undefined
            },
            {
                "id": "924824001501605968",
                "name": "devbear",
                "role": "captain",
                "team": "924824001501605968"
            },
            {
                "id": "344679005208838145",
                "name": "Borla78",
                "role": "deputy",
                "team": undefined
            },
            {
                "id": "179405686466150402",
                "name": "GMSchwartz",
                "role": "saturdayPlayer",
                "team": undefined
            },
            {
                "id": "817605144685576193",
                "name": "Get To Know WoWs Podcast",
                "role": "weekendPlayer",
                "team": undefined
            },
            {
                "id": "721949644606931036",
                "name": "KS Recruiter",
                "role": "sundayPlayer",
                "team": undefined
            },
            {
                "id": "261373848904007690",
                "name": "DinosaurzRuS",
                "role": "deputy",
                "team": undefined
            },
            {
                "id": "235088799074484224",
                "name": "Rythm",
                "role": "sundayPlayer",
                "team": undefined
            },
            {
                "id": "633110582865952799",
                "name": "Track",
                "role": "saturdayPlayer",
                "team": undefined
            },
            {
                "id": "759933859310993449",
                "name": "WG Code URL",
                "role": "saturdayPlayer",
                "team": undefined
            },
            {
                "id": "779729472642351155",
                "name": "WoWs CB JSON",
                "role": "deputy",
                "team": undefined
            }
        ],
        "teams": [
            {
                "id": "924824001501605968",
                "name": "devbear",
                "captain": {
                    "id": "924824001501605968",
                    "name": "devbear",
                    "role": "captain",
                    "team": "924824001501605968"
                },
                "deputies": [],
                "players": []
            },
            {
                "id": "205547921029070849",
                "name": "mb67",
                "captain": {
                    "id": "205547921029070849",
                    "name": "mb67",
                    "role": "captain",
                    "team": "205547921029070849"
                },
                "deputies": [],
                "players": []
            }
        ]
    })

    await responseMessage.edit({ content: `Seeding complete.`, allowedMentions: { repliedUser: (replying === "true") }});

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Administrator"
};

exports.help = {
    name: "seed",
    category: "System",
    description: "Seeds a test players and teams.",
    usage: "seed"
};


