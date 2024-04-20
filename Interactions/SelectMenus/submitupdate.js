const RemoveButtonsFromOriginal = require("../../Functions/RemoveButtonsFromOriginal")
const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');
const { GetFMRoot } = require("../../Functions");
const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isStringSelectMenu()){ return false; }
        if (interaction.customId != "submitupdate"){ return; }
        let playlist = "";
        let mapId = "";
        let weight = 0;
        var validWeight = false;
        var validId = false;
        for (var i = 0; i < interaction.values.length; i++){
            if (interaction.values[i].includes("---")){
                valSplit = interaction.values[i].split("---")
                playlist = valSplit[0];
                mapId = valSplit[1]
                validId = true;
            }
            else if (typeof parseFloat(interaction.values[i]) == 'number'){
                weight = parseFloat(interaction.values[i])
                validWeight = true;
            }
            else {
                interaction.reply({content: `Invalid MapID or Weight format. This is Moosen's fault. Hey <@${config.users.botOwner} come look what you did!`})
                return;
            }
        }
        if (!validId || !validWeight){
            interaction.reply({content:"One category, one weight, dumbass. Try again.\nYou can fix the existing select menu or use **/updatemap** to start over.",ephemeral:true})
            return;
        }
        const headers = {
            'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
        }
        const url = `${config.urls.api}/updatemap/${mapId}?category=${playlist.toLowerCase()}&weight=${weight}`
        axios({method:'post',url:url,headers:headers}).then(function(resp){
            if (resp.data && resp.data.includes("Updated map")){
                console.info("Success!!!")
                //TODO HERE: Get map info from the json, re-create the embed from before.
                async function searchMaps(){
                    const headers = {
                        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                    }
                    const maps = await nfetch(`${config.urls.tagpro}/maps.json`, {headers:headers})
                    const body = await maps.json();
                    for (const key in body){
                        for (const key2 in body[key]){
                            let x = body[key][key2]
                            if (x._id.includes(mapId)){
                                var tmp = {
                                    id: x._id,
                                    name: x.name,
                                    author: x.author,
                                    score: x.score,
                                    key: x.key,
                                    weight: x.weight,
                                    category: x.category.charAt(0).toUpperCase() + x.category.slice(1)
                                }
                                return tmp;
                            }
                        }
                    }                    
                }
        
                searchMaps().then(function(x){
                    const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
                    const baseUrl = GetFMRoot();
                    const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
                    const embed = new EmbedBuilder()
                        .setColor('#CDDC39')
                        .setThumbnail(imageUrl)
                        .setAuthor({name: "Map Update", iconURL: iconUrl})
                        .setDescription('Title: **'+x.name+'**\n'
                                        + 'Category: **' + playlist + '** (was ' + x.category + ')\n'
                                        + 'Weight: **' + weight.toFixed(1) + '** (was ' + x.weight.toFixed(1) + ')\n'
                                        + 'Map ID: **'+x.id+'**\n'
                                        + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')')
                        .setTimestamp();
                    const mtcAdminChannel = interaction.client.channels.cache.get(config.channels.mtcAdmin);
                    mtcAdminChannel.send({content:`**Map Updated\n** *${x.name}* by ${x.author}`,embeds:[embed]})
                    interaction.update({embeds: [embed], content: "**Update complete.** Please allow up to 10 minutes for changes to go into effect.", ephemeral:true})
                });
            }
            else {
                console.error("FAILURE! ABORT!")
                interaction.update({content:`**Potential API error.** URL:${url}\n Please investigate map ${mapId}`})
            }
        })
        RemoveButtonsFromOriginal(interaction);
    }
    catch (err) {
        console.error(err)
    }
}