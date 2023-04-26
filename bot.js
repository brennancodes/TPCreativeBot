require("dotenv").config();
const config = process.env.ENVIRONMENT == "Production" ? require("./config.json") : require("./localConfig.json")
const fs = require('fs');
const slashCommands = fs.readdirSync("./Interactions/SlashCommands").filter(file=>file.endsWith('.js') && !file.toLowerCase().includes("index"));
const buttons = fs.readdirSync("./Interactions/Buttons").filter(file=>file.endsWith('.js') && !file.toLowerCase().includes("index"));
const selectMenus = fs.readdirSync("./Interactions/SelectMenus").filter(file=>file.endsWith('.js') && !file.toLowerCase().includes("index"));
const messageReactionAdds = fs.readdirSync("./EventListeners/MessageReactionAdd").filter(file=>file.endsWith('.js') && !file.toLowerCase().includes("index"));
const { PingMTC, RefreshPins } = require("./Functions");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const { Client, GatewayIntentBits, Partials, ApplicationCommand } = require("discord.js");

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
//client.setMaxListeners(20)
const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

client.once("ready", () => {
    PingMTC(client);
    RefreshPins(client);
    //console.log(client.user.avatar)
    // if (client.user.avatar != "b977248a0a4cdb441165f749a6be6f38"){
    //     // client.user.setAvatar("https://i.imgur.com/VzlbIwL.png")
    //     // client.user.setAvatar("https://imgur.com/UiKKgLe.png")
    // }
    //client.user.setAvatar("https://cdn.discordapp.com/attachments/999662176618958968/1047746767833284618/FavIcon_1.png")
    // CalculateRotationBalance(client) // Using this method here will force run it on bot startup
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()){
        for (const cmd of slashCommands){
            const event = require(`./Interactions/SlashCommands/${cmd}`)
            if (event){
                event.execute(interaction)
            }
        }
    }
    if (interaction.isButton()){
        for (const cmd of buttons){
            const event = require(`./Interactions/Buttons/${cmd}`)
            event.execute(interaction);
        }
        // We run through slashCommands again because certain functions can be hit by buttons or slashCommands
        // findmap, removemap, updatemap
        for (const cmd of slashCommands){
            const event = require(`./Interactions/SlashCommands/${cmd}`)
            event.execute(interaction);
        }
    }
    if (interaction.isStringSelectMenu()){
        for (const cmd of selectMenus){
            const event = require(`./Interactions/SelectMenus/${cmd}`)
            event.execute(interaction);
        }
    }
});

client.on('messageReactionAdd', async(reaction, user)=>{
    for (const cmd of messageReactionAdds){
        const event = require(`./EventListeners/MessageReactionAdd/${cmd}`)
        event.execute(reaction, user);
    }
});


client.login(process.env.TOKEN).then(function(){
    console.log(`${client.user.tag} has logged in!`);
});

async function main() {
    const commands = [
        {
            name: 'creativehelp',
            description: 'See my available commands'
        },
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
            description: 'Nominate a Trial or Rotation Map to be removed',
            options: [
                {
                    name: 'name',
                    description: 'Search for a Trial or Rotation map by name',
                    type: 3,
                    required: true,
                }
            ]
        },
        {
            name: 'findmap',
            description: 'Find a map from the Rotation, Trial, Classic, Retired, or Group playlists',
            options: [
                {
                    name: 'name',
                    description: 'Search for a map by name',
                    type: 3,
                    required: true,
                }
            ]
        },
        {
            name: 'findfortunatemap',
            description: 'Find a map hosted on FortunateMaps',
            options: [
                {
                    name: 'name',
                    description: 'Search for a fortunate map by name',
                    type: 1,
                    required: false,
                    options: [
                        {
                            name: 'name',
                            description: 'Search for a fortunate map by name',
                            type: 3,
                            required: true
                        }
                    ]
                },
                {
                    name: 'code',
                    description: 'Search for a fortunate map by code',
                    type: 1,
                    required: false,
                    options: [
                        {
                            name: 'code',
                            description: 'Search for a fortunate map by code',
                            type: 4,
                            required: true
                        }
                    ]
                }
            ]
        },
        {
            name: 'getcurrentrating',
            description: 'Get the current rating of a TagPro map',
            options: [
                {
                    name: 'name',
                    description: 'Search for a map by name',
                    type: 3,
                    required: true,
                }
            ]
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
        },
        {
            name: 'rotationsummary',
            description: 'Get current State of Rotation'
        },
        {
            name: 'updatemap',
            description: 'Update any known map',
            options: [
                {
                    name: 'name',
                    description: 'Search for a map by name',
                    type: 3,
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
        console.error(err);
    }
}

main();