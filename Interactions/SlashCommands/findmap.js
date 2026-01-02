const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName, GetFMRoot } = require("../../Functions");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")

module.exports.execute = (interaction) => {
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
                if (interaction.message != undefined){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/findmap` again with different parameters."})
                }
                else {
                    interaction.reply({content:"Could not find any more maps matching that string.\n Try using `/findmap` again with different parameters.", ephemeral:true})
                }
                return;
            }
            return map;
        }

        searchMaps().then(function(x){
            if (x == undefined){
                return;
            }
            const formattedMapByAuthor = `${x.name.length > 125 ? x.name.substring(0,122)+ '...' : x.name} by ${x.author.length > 125 ? x.author.substring(0,122)+ '...' : x.author}`
            const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = GetFMRoot();
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg"
            const embed = new EmbedBuilder()
                .setColor('#CDDC39')
                .setImage(imageUrl)
                .setAuthor({name: formattedMapByAuthor, iconURL: iconUrl})
                .setDescription('Category: **'+x.category+'**\n'
                                + `Current Rating: **${x.score == 0 ? 'Hidden' : x.score +' ('+x.votes+')'}**\n`)
                .setFooter({text:"\n\u200b\nNot right? Try clicking Next Map."});
            const row = new ActionRowBuilder()
            if (counter == 1){
                row.addComponents(
                    new ButtonBuilder().setCustomId(`findmap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map').setDisabled(),
                )
            }
            else {
                row.addComponents(
                    new ButtonBuilder().setCustomId(`findmap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map'),
                )
            }
            row.addComponents(
                new ButtonBuilder().setCustomId(`findmap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map 🡲'),
                new ButtonBuilder().setCustomId(`ShareToChannel`).setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
                new ButtonBuilder().setCustomId('cancelaction---find').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
            )
            if (interaction.message != undefined){
                interaction.update({embeds:[embed], content:"Is this your map?", ephemeral: true, components: [row]})
            }
            else {
                interaction.reply({ embeds:[embed], content:"Is this your map?", ephemeral: true, components: [row] })
            }
        })
    }
    catch (err){
        console.error(err);
    }
}