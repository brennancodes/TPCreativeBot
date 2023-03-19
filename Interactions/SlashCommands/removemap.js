const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { RemoveButtonsFromOriginal, GetMapByName } = require("../../Functions")

module.exports = (client) => {
    client.on('interactionCreate', interaction => {
        try {
            if (!interaction.isChatInputCommand() && !interaction.isButton()){
                return false;
            }
            var searchString = "";
            var counter = 1;
            if (interaction.isChatInputCommand()){
                if (!interaction.commandName.includes("removemap")){
                    return false;
                }
            }
            if (interaction.isButton()){
                if (!interaction.customId.includes("removemap")){
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
                const map = await GetMapByName(searchString, counter, true);
                if (map != null){
                    foundMatch = true;
                }
                if (!foundMatch){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/removemap` again with different parameters."})
                    return;
                }
                return map;
            }

            searchMaps().then((x)=>{
                if (x == undefined){
                    return;
                }
                const imageUrl = `https://static.koalabeast.com/images/maps/${x.key.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
                const baseUrl = "https://fortunatemaps.herokuapp.com/"
                const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
                const embed = new EmbedBuilder()
                    .setColor('#CDDC39')
                    .setThumbnail(imageUrl)
                    .setAuthor({name: "Confirm Removal Nomination", iconURL: iconUrl})
                    .setDescription('Title: **'+x.name+'**\n'
                                    + 'Category: **'+x.category+'**\n'
                                    + 'Current Rating: **'+x.score+'**\n'
                                    + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ConfirmMapRemoval---${x.id}`).setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                    new ButtonBuilder().setCustomId(`removemap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map >>'),
                    new ButtonBuilder().setCustomId('cancelaction---remove').setStyle(ButtonStyle.Secondary).setLabel('Cancel')
                )

                if (counter > 1){
                    interaction.update({embeds:[embed], content:"*Verify that you've selected the correct map to update.* \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row]})
                }
                else {
                    interaction.reply({ embeds:[embed], content:"*Verify that you've selected the correct map to update.* \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row] })
                }
            });
        }
        catch (err){
            console.log(err);
        }
        
    })
}