require("dotenv").config();
const config = require("./config.json");
const { SubmitMap, RemoveMap, GetFeedback } = require("./Interactions/SlashCommands")
const { ApproveDenyVote, RemoveKeepVote } = require("./EventListeners/MessageReactionAdd")
const { ConfirmMapSubmission, CancelMapSubmission, MarkAsAdded, MarkAsRemoved } = require("./Interactions/Buttons")
const { RemoveRotationMap } = require("./Interactions/SelectMenus")
const { PingMTC } = require("./Functions");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ],
    partials: [
        Partials.Channel, 
        Partials.Message, 
        Partials.Reaction, 
        Partials.User 
    ]
});
const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

client.once("ready", () => {
    SubmitMap(client);
    RemoveMap(client);
    ConfirmMapSubmission(client);
    CancelMapSubmission(client);
    GetFeedback(client);
    MarkAsAdded(client);
    MarkAsRemoved(client);
    RemoveRotationMap(client);
    ApproveDenyVote(client);
    RemoveKeepVote(client);
    PingMTC(client);
});

client.login(process.env.TOKEN).then(function(){
    console.log(`${client.user.tag} has logged in!`);
});

async function main() {
    const commands = [
        {
            name: 'submitmap',
            description: 'Code from FortunateMaps',
            options: [
                {
                    name: 'code',
                    description: 'Code from FortunateMaps',
                    type: 4,
                    required: true,
                }
            ]
        },
        {
            name: 'removemap',
            description: 'Nominate a Rotation Map to be removed'
        },
        {
            name: 'getfeedback',
            description: 'Code from FortunateMaps',
            options: [
                {
                    name: 'code',
                    description: 'Code from FortunateMaps',
                    type: 4,
                    required: true,
                }
            ]
        }
    ];
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(config.users.bot,config.guildId), {
            body: commands,
        })
    } catch (err) {
        console.log(err);
    }
}

main();