const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName } = require("../../Functions");

module.exports = (client) => {
    client.on('interactionCreate',interaction => {
        try {
            if (!interaction.isChatInputCommand() && !interaction.isButton()){
                return false;
            }
            var searchString = "";
            var counter = 1;
            var counterMinusOne;
            if (interaction.isChatInputCommand()){
                if (!interaction.commandName.includes("findmap")){
                    return false;
                }
            }
            if (interaction.isButton()){
                if (!interaction.customId.includes("findmap")){
                    return false;
                }
                searchString = interaction.customId.split("---")[1]
                counter = interaction.customId.split("---")[2];
                counterMinusOne = counter-1;
                counter++;
            }
            else {
                searchString = interaction.options.data[0].value;
            }
            async function searchMaps(){
                var foundMatch = false;
                const map = await GetMapByName(searchString, counter);
                if (map != null){
                    foundMatch = true;
                }
                if (!foundMatch){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/findmap` again with different parameters."})
                    return;
                }
                return map;
            }
    
            searchMaps().then(function(x){
                if (x == undefined){
                    return;
                }
                const imageUrl = `https://static.koalabeast.com/images/maps/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
                const baseUrl = "https://fortunatemaps.herokuapp.com/"
                const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
                const embed = new EmbedBuilder()
                    .setColor('#CDDC39')
                    .setThumbnail(imageUrl)
                    .setAuthor({name: "Map Found!", iconURL: iconUrl})
                    .setDescription('Title: **'+x.name+'**\n'
                                    + 'Category: **'+x.category+'**\n'
                                    + 'Current Rating: **'+x.score+'**\n'
                                    + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')')
                    .setFooter({text:"Not the map you were looking for? \nTry navigating to the next matching map using the buttons below."});
                const row = new ActionRowBuilder()
                if (counter == 1){
                    row.addComponents(
                        new ButtonBuilder().setCustomId(`findmap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('<< Prev Map').setDisabled(),
                        new ButtonBuilder().setCustomId(`findmap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map >>'),
                        new ButtonBuilder().setCustomId('cancelaction---find').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
                    )
                }
                else {
                    row.addComponents(
                        new ButtonBuilder().setCustomId(`findmap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('<< Prev Map'),
                        new ButtonBuilder().setCustomId(`findmap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map >>'),
                        new ButtonBuilder().setCustomId('cancelaction---find').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
                    )
                }
                if (counter > 1){
                    interaction.update({embeds:[embed], content:"Is this your map? \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row]})
                }
                else {
                    interaction.reply({ embeds:[embed], content:"Is this your map? \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row] })
                }
            })
        }
        catch (err){
            console.log(err);
        }

    })
}