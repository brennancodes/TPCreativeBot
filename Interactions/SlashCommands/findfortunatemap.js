const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { RemoveButtonsFromOriginal, GetMapByName, GetFMRoot } = require("../../Functions");
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
        if (interaction.isChatInputCommand() && interaction.options.data[0].name=="code"){
            var code = interaction.options.data[0].options[0].value;
            var baseUrl = GetFMRoot();
            var imageUrl = baseUrl + "preview/" + code + ".jpeg";
            var mapUrl = baseUrl + "map/" + code;
            var iconUrl = baseUrl + "/assets/logo.png"
            var title = "";
            var author = "";

            return request({
                uri: mapUrl,
                method: 'GET'
            }, function(error, response, html){
                if(!error && response.statusCode == 200){
                    const $ = cheerio.load(html);
                    title = $('.card-title').find('b').first().text() 
                    author = $('.card-title').find('b').last().text();
                }
                else {
                    console.error(error, response.statusCode);
                }
                if (title == "" && author == ""){
                    interaction.reply({content:`Map not found!\nPlease double-check the code \`${code}\` and contact <@${config.users.botOwner}> if you're certain it's correct.`,ephemeral:true,allowedMentions:{"users":[]}})
                }
                else {
                    const formattedMapByAuthor = `${title.length > 125 ? title.substring(0,122)+ '...' : title} by ${author.length > 125 ? author.substring(0,122)+ '...' : author}`
                    const formattedLinks = `**${code}** | [**Map**](${baseUrl}map/${code}) | [**Author**](${baseUrl}profile/${author.split(" ").join("_")}) | [**Test Map**](${baseUrl}test/${code})`                
                    const embed = new EmbedBuilder()
                        .setColor('#7bcf5c')
                        .setImage(imageUrl)
                        .setAuthor({name: formattedMapByAuthor, iconURL: iconUrl})
                        .setDescription(formattedLinks);
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`ShareToChannel`).setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
                        new ButtonBuilder().setCustomId('cancelaction---find').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
                    )
                    interaction.reply({ embeds:[embed], content:"Is this your map?", ephemeral: true, components: [row] })
                }
            })
        }
        else{
            const url = `${GetFMRoot()}search?q=${searchString}&p=${(Math.ceil(counter/24))}`
            const getHTML = new Promise((resolve,reject)=>{
                return request({
                    uri: url,
                    method: 'GET'
                }, function(error, response, html){
                    if(!error && response.statusCode == 200){
                        const $ = cheerio.load(html);
                        title = $(`.map-card:nth-of-type(${indexCounter})`).find('b').first().text();
                        author = $(`.map-card:nth-of-type(${indexCounter})`).find('b').last().text();
                        mapId = $(`.map-card:nth-of-type(${indexCounter})`).find('.map-image-link').first().attr('href')
                        if (mapId) {mapId = mapId.split("/").pop();}
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
                const baseUrl = GetFMRoot();
                const iconUrl = baseUrl + "/assets/logo.png"
                const formattedMapByAuthor = `${x.name.length > 125 ? x.name.substring(0,122)+ '...' : x.name} by ${x.author.length > 125 ? x.author.substring(0,122)+ '...' : x.author}`
                const formattedLinks = `**${x.code}** | [**Map**](${baseUrl}map/${x.code}) | [**Author**](${baseUrl}profile/${x.author.split(" ").join("_")}) | [**Test Map**](${baseUrl}test/${x.code})`
                const embed = new EmbedBuilder()
                    .setColor('#7bcf5c')
                    .setImage(`${baseUrl}preview/${x.code}.jpeg`)
                    .setAuthor({name: formattedMapByAuthor, iconURL: iconUrl})
                    .setDescription(formattedLinks)
                    .setFooter({text:"\n\u200b\nNot right? Try clicking Next Map."});
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

    }
    catch (err){
        console.error(err);
    }
}