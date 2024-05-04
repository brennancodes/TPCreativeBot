const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const {EmbedBuilder} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const getMapById = require("../../Functions/GetMapById")
const axios = require('axios');
const { GetFMRoot } = require("../../Functions");

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("ConfirmGetCurrentRating")){ return false; }
        else {
            const map = await getMapById(interaction.customId.split("---")[1]);

            const headers = {
                'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
            }
            const url = `${config.urls.api}/getmap/${map.id}`
            const imageUrl = `${config.urls.image}/${map.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = GetFMRoot();
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setThumbnail(imageUrl)
                .setAuthor({name: "Map Data & Stuff", iconURL: iconUrl})
                .setTimestamp();
            axios({method:'get',url:url,headers:headers}).then(function(resp){
                if (resp.data && parseFloat(resp.data.score) != NaN){
                    console.info("Successful request. Response: ", resp.data)
                    map.score = resp.data.score;
                    map.votes = resp.data.totalUsers;
                    embed.setDescription('Title: **'+map.name+'**\n'
                        + 'Category: **'+map.category+'**\n'
                        + 'Current Rating: **'+map.score+'%** (' + map.votes + ' votes)\n'
                        + 'Author: [**' + map.author + '**](' + baseUrl + 'profile/' + map.author.split(" ").join("_") + ')')
                    .setColor("#7bcf5c");
                    interaction.update({content:"GET request successful. Showing accurate score (this info may be private).",embeds:[embed],ephemeral:true})
                }
                else {
                    embed.setDescription('Title: **'+map.name+'**\n'
                        + 'Category: **'+map.category+'**\n'
                        + 'Current Rating: **'+map.score+'%**\n'
                        + 'Author: [**' + map.author + '**](' + baseUrl + 'profile/' + map.author.split(" ").join("_") + ')')
                    .setColor("#da3e52");
                    interaction.update({content:"GET request failed. Showing public data.",embeds:[embed],ephemeral:true})
                }
            });

            RemoveButtonsFromOriginal(interaction, false);
        }
    }
    catch (err) {
        console.error(err)
    }
}