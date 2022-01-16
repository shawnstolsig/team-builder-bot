const config = require("../config.js");
const { settings } = require("../modules/settings.js");
const logger = require("../modules/Logger");
const { drafts } = require("../modules/enmaps");

exports.run = async (client, message, [ksc, ...values], level) => {
    const replying = settings.ensure(message.guild.id, config.defaultSettings).commandReply;

    const responseMessage = await message.reply({ content: `Seeding...`, allowedMentions: { repliedUser: (replying === "true") }});

    // seed for Kill Steal discord server
    if(ksc){
        drafts.set(message.guild.id,{
            "eventChannel": {
                "id": "915422811483422791",
                "name": "event-planning"
            },
            "eventName": "Championship of Kill Steal",
            "players": [
                {
                    "id": "205547921029070849",
                    "name": "[KSC] manbear67",
                    "role": "sundayPlayer",
                    "team": undefined
                },
                {
                    "id": "337474972945743883",
                    "name": "[KSC] torino2dc",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "179405686466150402",
                    "name": "[KSC] GMSchwartz",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "354778357981773824",
                    "name": "[KSC] AussieZeus",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "344679005208838145",
                    "name": "[KSC] Borla78",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "185531244476497920",
                    "name": "[KSC] Serpent Lord",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "740238173950705797",
                    "name": "[KSD] Danilovz",
                    "role": "captain",
                    "team": undefined
                },
                {
                    "id": "342825250356068353",
                    "name": "[KSE] ValkyrieUSMC",
                    "role": "deputy",
                    "team": undefined
                },
                {
                    "id": "350824152799772674",
                    "name": "[KSC] Cowboy_WY",
                    "role": "deputy",
                    "team": undefined
                },
                {
                    "id": "546454026825236639",
                    "name": "[KSD] EEWombat",
                    "role": "deputy",
                    "team": undefined
                },
                {
                    "id": "318096903503872000",
                    "name": "[KSD] feuerja",
                    "role": "deputy",
                    "team": undefined
                },
                {
                    "id": "180864728187273216",
                    "name": "[KSD] Minish Sage",
                    "role": "deputy",
                    "team": undefined
                },
                {
                    "id": "485201772785172482",
                    "name": "[KSE] Tcup66",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "167420825534857216",
                    "name": "[KSF] ASR37",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "378651137986920478",
                    "name": "[KSF] McRendel1ten",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "344329519366406145",
                    "name": "[KSC] AegisWings",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "362357860530651137",
                    "name": "[KSC] Ahskance",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "200182529351745536",
                    "name": "[KSC] KingNeptunes",
                    "role": "weekendPlayer",
                    "team": undefined
                },
                {
                    "id": "242161793261109259",
                    "name": "[KSC] The_Transformer_Mic",
                    "role": "saturdayPlayer",
                    "team": undefined
                },
                {
                    "id": "49180198897188864",
                    "name": "[KSC] themanwithanrx7",
                    "role": "saturdayPlayer",
                    "team": undefined
                },
                {
                    "id": "411316907678105603",
                    "name": "[KSD] Comrade Xin",
                    "role": "saturdayPlayer",
                    "team": undefined
                },
                {
                    "id": "412392306100928513",
                    "name": "[KSD] Bull_Reeves",
                    "role": "sundayPlayer",
                    "team": undefined
                },
                {
                    "id": "139495592391999488",
                    "name": "[KSD] DMFDMinister",
                    "role": "sundayPlayer",
                    "team": undefined
                },
                {
                    "id": "370384606450679808",
                    "name": "[KSD] FitzFitzFitz",
                    "role": "sundayPlayer",
                    "team": undefined
                }
            ]
        })
    }

    // seed for manbear dev server
    else {
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
                // {
                //     "id": "759933859310993449",
                //     "name": "WG Code URL",
                //     "role": "saturdayPlayer",
                //     "team": undefined
                // },
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

    }

    await responseMessage.edit({ content: `Seeding complete.`, allowedMentions: { repliedUser: (replying === "true") }});

};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    permLevel: "Bot Owner"
};

exports.help = {
    name: "seed",
    category: "System",
    description: "Seeds a test players and teams.",
    usage: "seed"
};


