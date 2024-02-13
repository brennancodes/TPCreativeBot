const axios = require('axios');
const cheerio = require("cheerio");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { GetFMRoot } = require('../../Functions');

module.exports.execute = (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "submitmap"){
        return false;
    }
    var code = interaction.options.data[0].value;
    var baseUrl = GetFMRoot();
    var imageUrl = baseUrl + "preview/" + code + ".jpeg";
    var mapUrl = baseUrl + "map/" + code;
    var jsonUrl = baseUrl + "json/" + code + ".json";
    var iconUrl = baseUrl + "/assets/logo.png"
    var title = "";
    var author = "";
    var description = "";

    axios({method:'get',url:jsonUrl}).then(function(resp){
        if (resp.data.info.name == "Untitled"){
            interaction.reply({content:`Something's up with your JSON file. Make sure the metadata of your map does not list it as "Untitled", and contact <@${config.users.botOwner}> if the issue persists.`,ephemeral:true})
            return false;
        }
        else {
            axios.get(mapUrl).then(function(resp, error){
                if(!error && resp.status == 200){
                    const $ = cheerio.load(resp.data);
                    title = $('.card-title').find('b').first().text() 
                    author = $('.card-title').find('b').last().text();
                    description = $('.map-description').text();
                }
                else {
                    console.error(error, response.status);
                }
                if (title == "" && author == ""){
                    interaction.reply({content:`Map not found!\nPlease double-check the code \`${code}\` and contact <@${config.users.botOwner}> if you're certain it's correct.`,ephemeral:true,allowedMentions:{"users":[]}})
                }
                else {
                    const embed = new EmbedBuilder()
                        .setColor('#7bcf5c')
                        .setThumbnail(imageUrl)
                        .setAuthor({name: "Confirm Map Submission", iconURL: iconUrl})
                        .setDescription('Title: [**'+title+'**]('+mapUrl+')\n'
                                        + 'Map ID: **'+code+'**\n'
                                        + 'Author: [**' + author + '**](' + baseUrl + 'profile/' + author.split(" ").join("_") + ')\n'
                                        + 'Description: ' + description + '\n\n'
                                        + '[**Test Map**](' + baseUrl + 'test/' + code + ')')
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ConfirmMapSubmission').setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                        new ButtonBuilder().setCustomId(`CancelMapSubmission---${code}`).setStyle(ButtonStyle.Secondary).setLabel('Cancel')
                    )
                    interaction.reply({ embeds:[embed], content:"*Verify that you've selected the correct map for submission.* \n*You can click the thumbnail to see a full-size image.*", ephemeral: true, components: [row] })
                }
            })
        }
    });
}