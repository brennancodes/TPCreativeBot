const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName, GetMapWithStats } = require("../../Functions");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isChatInputCommand() && !interaction.isButton()){
            return false;
        }
        var searchString = "";
        var counter = 1;
        var counterMinusOne;
        if (interaction.isChatInputCommand()){
            if (!interaction.commandName.includes("rankedmapinfo")){
                return false;
            }
        }
        if (interaction.isButton()){
            if (!interaction.customId.includes("rankedmapinfo")){
                return false;
            }
            searchString = interaction.customId.split("---")[1];
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
                    interaction.update({content:"Could not find any more ranked rotation maps matching that string.\n Try using `/rankedmapinfo` again with different parameters."});
                }
                else {
                    interaction.reply({content:"Could not find any ranked rotation maps matching that string.\n Try using `/rankedmapinfo` again with different parameters.", ephemeral:true});
                }
                return;
            }
            return map;
        }

        searchMaps().then(async function searchAndFilter(x){
            if (x == undefined){
                return;
            }

            // Fetch the full map data with stats from the API
            const mapWithStats = await GetMapWithStats(x.id);
            if (mapWithStats) {
                x = mapWithStats;
            }

            // Check if map is actually in ranked rotation
            if (!x.inRankedRotation) {
                // This map isn't in ranked rotation, search for the next one
                counter++;
                const nextMap = await GetMapByName(searchString, counter);
                if (nextMap) {
                    return searchAndFilter(nextMap);
                } else {
                    // No more maps found
                    if (interaction.message != undefined){
                        RemoveButtonsFromOriginal(interaction, true);
                        interaction.update({content:"Could not find any ranked rotation maps matching that string.\n Try using `/rankedmapinfo` again with different parameters."});
                    }
                    else {
                        interaction.reply({content:"Could not find any ranked rotation maps matching that string.\n Try using `/rankedmapinfo` again with different parameters.", ephemeral:true});
                    }
                    return;
                }
            }
            const formattedMapByAuthor = `${x.name.length > 125 ? x.name.substring(0,122)+ '...' : x.name} by ${x.author.length > 125 ? x.author.substring(0,122)+ '...' : x.author}`;
            const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`;
            const iconUrl = "https://b.thumbs.redditmedia.com/g0IY6wWcORTUY8i8vUbloTAC_N6i1qwcZqhN5UiNvLs.jpg";

            let description = '**Ranked Rotation**\n\n';

            if (x.timesPresented) {
                description += `Times Presented: **${x.timesPresented}**\n`;
            }
            if (x.timesSelected) {
                description += `Times Selected: **${x.timesSelected}**\n`;
            }
            if (x.selectionRate !== undefined && x.timesPresented > 0) {
                description += `Selection Rate: **${(x.selectionRate * 100).toFixed(1)}%**\n`;
            }

            if (x.headToHeadStats && x.headToHeadStats.length > 0) {
                description += '\n**Head-to-Head Stats:**\n';

                // Sort by win rate descending
                const sortedH2H = [...x.headToHeadStats].sort((a, b) => b.winRate - a.winRate);

                sortedH2H.forEach(h2h => {
                    const winRate = (h2h.winRate * 100).toFixed(1);
                    description += `vs **${h2h.opponentMapName}**: ${h2h.timesWon}W-${h2h.timesLost}L (${winRate}%)\n`;
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#CDDC39')
                .setImage(imageUrl)
                .setAuthor({name: formattedMapByAuthor, iconURL: iconUrl})
                .setDescription(description)
                .setFooter({text:"\n\u200b\nNot right? Try clicking Next Map."});

            const row = new ActionRowBuilder();
            if (counter == 1){
                row.addComponents(
                    new ButtonBuilder().setCustomId(`rankedmapinfo---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map').setDisabled(),
                );
            }
            else {
                row.addComponents(
                    new ButtonBuilder().setCustomId(`rankedmapinfo---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map'),
                );
            }
            row.addComponents(
                new ButtonBuilder().setCustomId(`rankedmapinfo---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map 🡲'),
                new ButtonBuilder().setCustomId(`ShareToChannel---rminfo`).setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
                new ButtonBuilder().setCustomId('cancelaction---ranked').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks'),
            );
            if (interaction.message != undefined){
                interaction.update({embeds:[embed], content:"Ranked map selection statistics:", ephemeral: true, components: [row]});
            }
            else {
                interaction.reply({ embeds:[embed], content:"Ranked map selection statistics:", ephemeral: true, components: [row] });
            }
        });
    }
    catch (err){
        console.error(err);
    }
};
