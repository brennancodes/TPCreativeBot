const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const {EmbedBuilder,MessageFlags} = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const getMapById = require("../../Functions/GetMapById")
const axios = require('axios');
const { GetFMRoot } = require("../../Functions");

module.exports.execute = async (interaction) => {
    try {
        if (!interaction.isButton()){ return false; }
        if (!interaction.customId.includes("ConfirmResetVotes")){ return false; }
        else {
            const map = await getMapById(interaction.customId.split("---")[1]);

            const headers = {
                'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
            }
            const url = `${config.urls.api}/clearmapratings/${map.id}`
            const imageUrl = `${config.urls.image}/${map.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = GetFMRoot();
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setThumbnail(imageUrl)
                .setAuthor({name: "Map Data & Stuff", iconURL: iconUrl})
                .setTimestamp();
            axios({method:'post',url:url,headers:headers}).then(function(resp){
                if (resp.data){
                    console.info("Successful request. Response: ", resp.data)
                    // map.score = resp.data.score;
                    // map.votes = resp.data.totalUsers;
                    embed.setDescription('Title: **'+map.name+'**\n'
                        + 'Category: **'+map.category+'**\n'
                    //    + 'Current Rating: **'+map.score+'%** (' + map.votes + ' votes)\n'
                        + 'Author: [**' + map.author + '**](' + baseUrl + 'profile/' + map.author.split(" ").join("_") + ')')
                    .setColor("#7bcf5c");
                    interaction.update({content:"POST request successful. Votes have been reset.",embeds:[embed],flags:MessageFlags.Ephemeral})
                    var mtcAdminChannel = interaction.client.channels.cache.get(config.channels.mtcAdmin);
                    mtcAdminChannel.send({content:`**${map.name}** by **${map.author}** votes reset by administrator.`,allowedMentions: {"users":[]}})
                }
                else {
                    embed.setDescription('Title: **'+map.name+'**\n'
                        + 'Category: **'+map.category+'**\n'
                    //    + 'Current Rating: **'+map.score+'%**\n'
                        + 'Author: [**' + map.author + '**](' + baseUrl + 'profile/' + map.author.split(" ").join("_") + ')')
                    .setColor("#da3e52");
                    interaction.update({content:"POST request failed. Votes unaffected.",embeds:[embed],flags:MessageFlags.Ephemeral})
                }
            });

            RemoveButtonsFromOriginal(interaction, false);
        }
    }
    catch (err) {
        console.error(err)
    }
}