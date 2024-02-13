const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName, GetFMRoot } = require("../../Functions");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isChatInputCommand() && !interaction.isButton()){
            return false;
        }
        var searchString = "";
        var counter = 1;
        if (interaction.isChatInputCommand()){
            if (!interaction.commandName.includes("getcurrentrating")){
                return false;
            }
        }
        if (interaction.isButton()){
            if (!interaction.customId.includes("getcurrentrating")){
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
            const map = await GetMapByName(searchString, counter);
            if (map != null){
                foundMatch = true;
            }
            if (!foundMatch){
                if (interaction.message != undefined){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/getcurrentrating` again with different parameters."})
                }
                else {
                    interaction.reply({content:"Could not find any more maps matching that string.\n Try using `/getcurrentrating` again with different parameters.", ephemeral:true})
                }
                return;
            }
            return map;
        }

        searchMaps().then(function(x){
            if (x == undefined){
                return;
            }
            const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = GetFMRoot();
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setColor('#CDDC39')
                .setThumbnail(imageUrl)
                .setAuthor({name: "Confirm Map", iconURL: iconUrl})
                .setDescription('Title: **'+x.name+'**\n'
                                + 'Category: **'+x.category+'**\n'
                                + 'Map ID: **'+x.id+'**\n'
                                + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`ConfirmGetCurrentRating---${x.id}`).setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                new ButtonBuilder().setCustomId(`getcurrentrating---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map 🡲'),
                new ButtonBuilder().setCustomId('cancelaction---getcurrent').setStyle(ButtonStyle.Secondary).setLabel('Cancel')
            )
            if (interaction.message != undefined){
                interaction.update({embeds:[embed], content:"Is this your map? \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row]})
            }
            else {
                interaction.reply({ embeds:[embed], content:"Is this your map? \n*You can click the thumbnail (if it exists) to see a full-size image.*", ephemeral: true, components: [row] })
            }
        })
    }
    catch (err){
        console.error(err);
    }
}