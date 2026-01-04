const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js")
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

        await interaction.deferReply({flags:MessageFlags.Ephemeral})

        const headers = {
            'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
        }

        const maps = await GetAllMaps();

        const embed = new EmbedBuilder()
                .setColor("#186360")
                .setAuthor({name:"State of Trial Rotation",iconURL:"https://imgur.com/QWrriCS.png"})
                .setTimestamp()

        for (var i = 0; i < maps.length; i++){
            if (maps[i].category === 'Trial'){
                const url = `${config.urls.api}/getmap/${maps[i].id}`
                await axios({method:'get',url:url,headers:headers}).then(function(resp){
                    if (resp.data && parseFloat(resp.data.score) != NaN){
                        embed.addFields({
                            name: `${resp.data.name}`,
                            value: "```\n" + `${resp.data.score}%\n${resp.data.totalUsers} votes` + "\n```",
                            inline: true
                        })
                    }
                    else {
                        console.log('shit')
                    }
                })
            }
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ShareToChannel---tsummary').setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
            new ButtonBuilder().setCustomId('cancelaction---summary').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
        )

        if (interaction){
            interaction.editReply({content:"Overview",embeds:[embed],components:[row],flags:MessageFlags.Ephemeral})
        }
        else {
            channel.send({content:"Overview",embeds:[embed]})
        }
    }
    catch (err){
        console.error(err);
    }
}