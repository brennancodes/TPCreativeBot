const axios = require('axios');
const cheerio = require("cheerio");
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { GetFMRoot, CheckForExistingMapInRotation } = require('../../Functions');

module.exports.execute = async (interaction) => {
    if (!interaction.isChatInputCommand()){
        return false;
    }
    if (interaction.commandName != "submitmap" && interaction.commandName != "manualadd"){
        return false;
    }
    await interaction.deferReply({flags:MessageFlags.Ephemeral})
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
        if (resp.data.info.name == "Untitled" || (resp.data.info.name.trim() != resp.data.info.name)){
            interaction.editReply({content:`Something's up with your JSON file. Make sure the metadata of your map has no extra whitespace and does not list it as "Untitled", and contact <@${config.users.botOwner}> if the issue persists.`,flags:MessageFlags.Ephemeral})
            return false;
        }
        else {
            axios.get(mapUrl).then(async function(resp, error){
                if(!error && resp.status == 200){
                    const $ = cheerio.load(resp.data);
                    title = $('.card-title').find('b').first().text();
                    author = $('.card-title').find('b').last().text();
                    description = $('.map-description').text();
                }
                else {
                    console.error(error, response.status);
                }
                if (title == "" && author == ""){
                    interaction.editReply({content:`Map not found!\nPlease double-check the code \`${code}\` and contact <@${config.users.botOwner}> if you're certain it's correct.`,flags:MessageFlags.Ephemeral,allowedMentions:{"users":[]}})
                }
                else {
                    const isUpdate = await CheckForExistingMapInRotation(title);
                    let color = isUpdate ? '#D850F7' : '#7bcf5c'
                    let header = isUpdate ? 'Confirm update submission' : 'Confirm map submission'
                    let content = isUpdate ? `**Hey!** Looks like you're trying to update a map that already is (or has been) in rotation.\nIf so, you're all set to go! If not, please cancel, change your map's name, and try again.`
                    : `*Verify that you've selected the correct map for submission.* \n*You can click the thumbnail to see a full-size image.*`

                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setThumbnail(imageUrl)
                        .setAuthor({name: header, iconURL: iconUrl})
                        .setDescription('Title: [**'+title+'**]('+mapUrl+')\n'
                                        + 'Map ID: **'+code+'**\n'
                                        + 'Author: [**' + author + '**](' + baseUrl + 'profile/' + author.split(" ").join("_") + ')\n'
                                        + 'Description: ' + description + '\n\n'
                                        + '[**Test Map**](' + baseUrl + 'test/' + code + ')')
                    if (interaction.commandName == "submitmap"){
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('ConfirmMapSubmission').setStyle(ButtonStyle.Primary).setLabel('Confirm'),
                            new ButtonBuilder().setCustomId(`CancelMapSubmission---${code}`).setStyle(ButtonStyle.Secondary).setLabel('Cancel')
                        )
                        interaction.editReply({ embeds:[embed], content:content, ephemeral: true, components: [row] })
                    }
                    if (interaction.commandName == "manualadd"){
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('ConfirmManualAdd').setStyle(ButtonStyle.Primary).setLabel('Add to Trial'),
                            // If eventually we can set an initial weight, we want to do something like this
                            //new ButtonBuilder().setCustomId('ConfirmManualAdd---trial').setStyle(ButtonStyle.Primary).setLabel('Add to Trial'),
                            //new ButtonBuilder().setCustomId('ConfirmManualAdd---full').setStyle(ButtonStyle.Primary).setLabel('Add to Standard'),
                            new ButtonBuilder().setCustomId(`CancelMapSubmission---${code}`).setStyle(ButtonStyle.Secondary).setLabel('Cancel')
                        )
                        interaction.editReply({ embeds:[embed], content:content, ephemeral: true, components: [row] })
                    }
                }
            })
        }
    });
}