const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { RemoveButtonsFromOriginal, GetMapByName, GetFMRoot } = require("../../Functions")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");
const axios = require('axios');

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isChatInputCommand() && !interaction.isButton()){
            return false;
        }
        var searchString = "";
        var counter = 1;
        if (interaction.isChatInputCommand()){
            if (!interaction.commandName.includes("promotemap")){
                return false;
            }
        }
        if (interaction.isButton()){
            if (!interaction.customId.includes("promotemap")){
                return false;
            }
            searchString = interaction.customId.split("---")[1]
            counter = interaction.customId.split("---")[2];
            counter++;
        }
        else {
            searchString = interaction.options.data[0].value;
        }

        async function searchMaps(){
            var foundMatch = false;            
            const map = await GetMapByName(searchString, counter, false, true);
            if (map != null){
                foundMatch = true;
            }
            if (!foundMatch){
                if (interaction.message != undefined){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/promotemap` again with different parameters."})
                }
                else {
                    interaction.reply({content:"Could not find any more maps matching that string.\n Try using `/promotemap` again with different parameters.", ephemeral:true})
                }
                return;
            }
            return map;
        }

        searchMaps().then(async (x)=>{
            if (x == undefined){
                return;
            }
            //const gif = await axios.get(`https://api.giphy.com/v1/gifs/random?tag=staredown&api_key=cHJGjczxMtp65VbiDC37JsnBEPRORotU`)
            //console.log(gif.data.data.url);
            const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = GetFMRoot();
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setColor('#CDDC39')
                //.setImage(gif.data.data.images.downsized.url)
                .setThumbnail(imageUrl)
                .setAuthor({name: "Confirm Removal Nomination", iconURL: iconUrl})
                .setDescription('Title: **'+x.name+'**\n'
                                + 'Category: **'+x.category+'**\n'
                                + 'Current Rating: **'+x.score+'**\n'
                                + 'Total Votes: **'+x.votes+'**\n'
                                + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ConfirmMapPromotion---${x.id}`).setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                new ButtonBuilder().setCustomId(`removemap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map 🡲'),
                new ButtonBuilder().setCustomId('cancelaction---trial').setStyle(ButtonStyle.Secondary).setLabel('Cancel')
            )

            if (interaction.message != undefined){
                interaction.update({embeds:[embed], content:"*Verify that you've selected the correct map to update.* \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row]})
            }
            else {
                interaction.reply({ embeds:[embed], content:"*Verify that you've selected the correct map to update.* \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row] })
            }
        });
    }
    catch (err){
        console.error(err);
    }
}