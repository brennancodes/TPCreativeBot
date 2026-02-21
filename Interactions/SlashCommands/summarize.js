const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { GetAllMaps } = require("../../Functions");
const axios = require('axios');

module.exports.execute = async (interaction) => {
    if (!interaction.isChatInputCommand() || !interaction.commandName.includes("summary") || 
    interaction.commandName == "rankedsummary" || interaction.commandName == "rotationsummary") {
        return false;
    }
    await interaction.deferReply({ flags:MessageFlags.Ephemeral });

    let mapFilter;
    let summaryType;
    let summaryTypeAbbreviation;
    switch (interaction.commandName) {
        case 'trialsummary':
            summaryType = "Trial";
            summaryTypeAbbreviation = "t";
            mapFilter = (map) =>
                map.category === 'Trial';
            break;

        case 'casualsummary':
            summaryType = "Casual";
            summaryTypeAbbreviation = "c";
            mapFilter = (map) =>
                map.category === 'Rotation' &&
                map.inCasualRotation === true;
            break;

        case 'classicsummary':
            summaryType = "Classic"
            summaryTypeAbbreviation = "l";
            mapFilter = (map) =>
                map.category === 'Classic';            
            break;

        case 'throwbacksummary':
            summaryType = "Throwback"
            summaryTypeAbbreviation = "th";
            mapFilter = (map) =>
                map.category === 'Retired' &&
                map.weight === 0.1;            
            break;

        default:
            return interaction.editReply({ content: 'Unknown summary type.' });
    }    


    const maps = await GetAllMaps();

    if (!maps || maps.length === 0) {
        await interaction.editReply({
            content: "Could not fetch trial rotation maps or no maps found.",
        });
        return;
    }

    const filteredMaps = maps.filter(mapFilter);
    const selectedMaps = [];
    const headers = {
        'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY,
    }

    for (const map of filteredMaps) {
        const url = `${config.urls.api}/getmap/${map.id}`
        await axios({method:'get',url:url,headers:headers}).then(function(resp){
            if (resp.data && Number.isFinite(parseFloat(resp.data.score))){
                selectedMaps.push(
                    {
                        name: resp.data.name,
                        score: parseFloat(resp.data.totalLikes/(resp.data.totalLikes+resp.data.totalDislikes))*100,
                        votes: resp.data.totalUsers,
                        plays: resp.data.totalPlays,
                        vpp: parseFloat(resp.data.totalUsers/resp.data.totalPlays).toFixed(3)
                    }
                )
            }
            else {
                console.log('shit')
            }
        })
    }

    // Sort maps by selection rate descending
    selectedMaps.sort((a, b) => b.score - a.score);

    let description = '```';

description +=
" Rk. " +
" Name                 " +
"  Score " +
"  Vts "; 
summaryType == "Trial" ? description += "  Plays     VPP  \n" : description += "\n";

selectedMaps.forEach((map, index) => {

    // --- RANK (3 chars including period) ---
    const rank = `${String(index + 1).padStart(2, ' ')}.`; // " 1."

    // --- NAME (20 chars exactly) ---
    const name = map.name
        .substring(0, 20)
        .padEnd(20, ' ');

    // --- SCORE (###.#%) exactly 6 chars, right aligned ---
    const scoreValue = Number.isFinite(map.score) ? map.score : 0;
    const score = `${scoreValue.toFixed(1)}%`.padStart(6, ' ');

    // --- VOTES (3 chars, right aligned) ---
    const votes = String(map.votes ?? 0).padStart(4, ' ');

    // --- PLAYS (5 chars, right aligned) ---
    const plays = String(map.plays ?? 0).padStart(6, ' ');

    // --- VPP (#.###) exactly 5 chars, right aligned ---
    const vppValue = Number.isFinite(parseFloat(map.vpp))
        ? parseFloat(map.vpp)
        : 0;
    const vpp = vppValue.toFixed(3).padStart(6, ' ');

    description +=
        ` ${rank} ` +
        ` ${name} ` +
        ` ${score} ` +
        ` ${votes} `; 
    summaryType == "Trial" ? description +=` ${plays}  ${vpp} \n` : description += "\n";
});
    description += '```';

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ShareToChannel---${summaryTypeAbbreviation}summary`).setStyle(ButtonStyle.Danger).setLabel('Share 📢'),
        new ButtonBuilder().setCustomId('cancelaction---summary').setStyle(ButtonStyle.Secondary).setLabel('Cool, thanks')
    )

    const embed = new EmbedBuilder()
        .setColor("#186360")
        .setAuthor({name:`${summaryType} Rotation Scores`,iconURL:"https://imgur.com/QWrriCS.png"})
        .setTimestamp()
        .setDescription(description)
        .setTimestamp();

    await interaction.editReply({ 
        embeds: [embed],
        components: [row],
        flags:MessageFlags.Ephemeral
    });
};