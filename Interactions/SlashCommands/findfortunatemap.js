const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName } = require("../../Functions");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const cheerio = require("cheerio");
const request = require("request");

module.exports.execute = (interaction) => {
    try {
        if (!interaction.isChatInputCommand() && !interaction.isButton()){
            return false;
        }
        var searchString = "";
        var counter = 1;
        var counterMinusOne;
        var mapId = "";
        var title = "";
        var author = "";
        var indexCounter = 1;
        if (interaction.isChatInputCommand()){
            if (!interaction.commandName.includes("findfortunatemap")){
                return false;
            }
        }
        if (interaction.isButton()){
            if (!interaction.customId.includes("findfortunatemap")){
                return false;
            }
            searchString = interaction.customId.split("---")[1]
            counter = interaction.customId.split("---")[2];
            counterMinusOne = counter-1;
            indexCounter = (counter % 24) + 1;
            counter++;
        }
        else {
            searchString = interaction.options.data[0].options[0].value;
        }
        const url = `https://fortunatemaps.herokuapp.com/search?q=${searchString}&p=${(Math.ceil(counter/24))}`
        console.log(url);
        const getHTML = new Promise((resolve,reject)=>{
            return request({
                uri: url,
                method: 'GET'
            }, function(error, response, html){
                if(!error && response.statusCode == 200){
                    const $ = cheerio.load(html);
                    console.log(indexCounter, counter);
                    title = $(`.map-card:nth-of-type(${indexCounter})`).find('b').first().text();
                    author = $(`.map-card:nth-of-type(${indexCounter})`).find('b').last().text();
                    mapId = $(`.map-card:nth-of-type(${indexCounter})`).find('.map-image-link').first().attr('href')
                    if (mapId) {mapId = mapId.split("/").pop();}
                    else {
                        if (interaction.message!=undefined){
                            interaction.update({content:"Could not find any more maps matching that string.\n Try using `/findfortunatemap` again with different parameters.", ephemeral:true})
                        }
                        else {
                            interaction.reply({content:`I don't know any maps by the name of ${searchString}.`})
                        }
                    }
                    console.log(title, author, mapId)
                    resolve({
                        name: title,
                        author: author,
                        code: mapId
                    });
                }
                else {
                    console.error(error, response.statusCode);
                    resolve(false);
                }
            })
        })

        getHTML.then((x)=>{
            var foundMatch = false;            
            if (x.name != "" && x.author != ""){
                foundMatch = true;
            }
            if (!foundMatch){
                if (interaction.message != undefined){
                    RemoveButtonsFromOriginal(interaction, true);
                    interaction.update({content:"Could not find any more maps matching that string.\n Try using `/findfortunatemap` again with different parameters."})
                }
                else {
                    interaction.reply({content:"Could not find any more maps matching that string.\n Try using `/findfortunatemap` again with different parameters.", ephemeral:true})
                }
                return;
            }
            //const imageUrl = `${config.urls.image}/${x.name.split(" ").join("_").replaceAll("_","%20").trim()}-small.png`
            const baseUrl = "https://fortunatemaps.herokuapp.com/"
            const iconUrl = baseUrl + "/assets/logo.png"
            const embed = new EmbedBuilder()
                .setColor('#7bcf5c')
                .setImage(`${baseUrl}preview/${x.code}.jpeg`)
                .setAuthor({name: "Map Found!", iconURL: iconUrl})
                .setDescription('Title: **'+x.name+'**\n'
                                + 'FM ID: **'+x.code+'**\n'
                                + 'Author: [**' + x.author + '**](' + baseUrl + 'profile/' + x.author.split(" ").join("_") + ')')
                .setFooter({text:"\n\u200b\nNot the map you were looking for? \nTry navigating to the next matching map using the buttons below."});
            const row = new ActionRowBuilder()
            if (counter == 1){
                row.addComponents(
                    new ButtonBuilder().setCustomId(`findfortunatemap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map').setDisabled(),
                )
            }
            else {
                row.addComponents(
                    new ButtonBuilder().setCustomId(`findfortunatemap---${searchString}---${counterMinusOne}`).setStyle(ButtonStyle.Primary).setLabel('🡰 Prev Map'),                    
                )
            }
            row.addComponents(
                new ButtonBuilder().setCustomId(`findfortunatemap---${searchString}---${counter}`).setStyle(ButtonStyle.Success).setLabel('Next Map 🡲'),
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