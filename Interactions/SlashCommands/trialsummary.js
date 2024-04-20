const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const axios = require('axios');
const { GetAllMaps } = require("../../Functions");

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "trialsummary"){
            return false;
        }
    
        const maps = await GetAllMaps();
        const embed = new EmbedBuilder()
                .setColor("#186360")
                .setAuthor({name:"State of Trial Rotation",iconURL:"https://imgur.com/QWrriCS.png"})
                .setTimestamp()
        for (var i = 0; i < maps.length; i++){
            if (maps[i].category === 'Trial'){
                embed.addFields({
                    name: `${maps[i].name}`,
                    value: "```\n" + `${maps[i].score}%\n${maps[i].votes} votes` + "\n```",
                    inline: true
                })
            }
        }
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ShareToChannel---tsummary').setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
            new ButtonBuilder().setCustomId('cancelaction---summary').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
        )
        if (interaction){
            interaction.reply({content:"Overview",embeds:[embed],components:[row],ephemeral:true})
        }
        else {
            channel.send({content:"Overview",embeds:[embed]})
        }
    }
    catch (err){
        console.error(err);
    }
    //const map = await getMapById(interaction.customId.split("---")[1]);

}

// var tmp = {
//     id: x._id,
//     name: x.name,
//     author: x.author,
//     score: x.score,
//     key: x.key,
//     weight: x.weight,
//     category: x.category.charAt(0).toUpperCase() + x.category.slice(1)
// }

// if (mapData[i].category == "rotation"){
//     embed.addFields(                        
//         {
//             name: "\n\u200b",
//             value: "\u200b",
//             inline: true
//         },
//         {
//             name: "\n"+formattedCategory,
//             value: mapData[i].totalWeight + mapData[i].avgScore,
//             inline: true
//         },
//         {
//             name: "\n\u200b",
//             value: "\u200b",
//             inline: true
//         }
//     )
// }