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

    function getMapAge(objectId) {
        const timestampHex = objectId.substring(0, 8);
        const created = new Date(parseInt(timestampHex, 16) * 1000);
        const now = new Date();
    
        const diffMs = now - created;
    
        const dayMs = 1000 * 60 * 60 * 24;
        const days = Math.floor(diffMs / dayMs);
    
        if (days < 30) {
            return `${days}d`.padStart(3, " ");
        }
    
        const months = Math.floor(days / 30);
    
        if (months < 12) {
            return `${months}m`.padStart(3, " ");
        }
    
        const years = Math.floor(months / 12);
    
        return `${years}y`.padStart(3, " ");
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
                        id: resp.data._id,
                        name: resp.data.name,
                        weight: resp.data.weight,
                        score: parseFloat(resp.data.totalLikes/(resp.data.totalLikes+resp.data.totalDislikes))*100,
                        votes: resp.data.totalUsers,
                        games: resp.data.casualMapSpawns,
                        vpg: parseFloat(resp.data.totalUsers/(resp.data.recentCasualMapSpawns ?? 1)).toFixed(3)
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

    let description = "```";
    let namePad = summaryType == "Trial" ? 10 : 14
    // ----- HEADER -----
    let header =
        //"Rk.".padEnd(3) + " " +
        "Name".padEnd(namePad) + " " +
        "Score".padStart(6) + " " +
        "Vts".padStart(3) + " ";
        summaryType == "Trial" ? header +=
        "Gms".padStart(3) + " " : header += "";
        header += "VPG".padStart(4) + " " + 
        "Age";

    description += header + "\n";

    // ----- ROWS -----
    selectedMaps.forEach((map, index) => {

        // Rk. (3 chars, right aligned like " 1.")
        const rank = `${index + 1}.`.padStart(3);

        // Name (namePad chars, left aligned)
        const name = (map.name ?? "")
            .substring(0, namePad)
            .padEnd(namePad);

        // Score (5 chars like "99.9%")
        const scoreValue = Number.isFinite(map.score) ? map.score : 0;
        const score = `${scoreValue.toFixed(1)}%`.padStart(6);

        // Votes (3 chars)
        const votes = String(map.votes ?? 0).padStart(3);

        // Games (3 chars)
        const games = String(map.games ?? 0).padStart(3);

        // VPG (4 chars like ".234")
        const vpgValue = Number.isFinite(parseFloat(map.vpg))
            ? parseFloat(map.vpg)
            : 0;

        const vpg = vpgValue < 1
            ? vpgValue.toFixed(3).slice(1)   // remove leading 0
            : vpgValue.toFixed(2);

        // Age (3 chars like "21d")
        const age = getMapAge(map.id);

        description +=
            //rank + " " +
            name + " " +
            score + " " +
            votes + " ";
            summaryType == "Trial" ? description +=
            games + " " : description += "";
            description += vpg + " " +
            age + "\n"
    });

    description += "```";

    const avgrtg = selectedMaps.reduce((sum, obj) => {
        const val = parseFloat(obj.score);
        return sum + (Number.isFinite(val) ? val : 0);
    }, 0) / selectedMaps.length;
    const avgvpg = selectedMaps.reduce((sum, obj) => {
        const val = parseFloat(obj.vpg);
        return sum + (Number.isFinite(val) ? val : 0);
    }, 0) / selectedMaps.length;
    const ttlwgt = selectedMaps.reduce((sum, obj) => sum + obj.weight, 0);
    //const avgage = "ignore"
    //console.log(selectedMaps)
    const avgage = averageObjectIdAge(selectedMaps)
    function averageObjectIdAge(arr, key = "id") {
        if (!arr.length) return "0 days";
    
        const now = Date.now();
    
        // Average creation timestamp
        const avgCreated = arr.reduce((sum, obj) => {
            const ts = parseInt(obj[key].substring(0, 8), 16) * 1000;
            return sum + ts;
        }, 0) / arr.length;
    
        const diffMs = now - avgCreated;
    
        const dayMs = 1000 * 60 * 60 * 24;
        const yearDays = 365;
        const monthDays = 30;
    
        let days = Math.floor(diffMs / dayMs);
    
        const years = Math.floor(days / yearDays);
        days -= years * yearDays;
    
        const months = Math.floor(days / monthDays);
        days -= months * monthDays;
    
        const parts = [];
    
        if (years) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
        if (months) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
        if (days || parts.length === 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    
        return parts.join(" ");
    }

    description+=`\n**Stats Summary:**`
    description+=`\nMaps: **${selectedMaps.length}** | Weight: **${ttlwgt.toFixed(2)}**`
    description+=`\nAvg score: **${avgrtg.toFixed(2)}%** | Avg VPG: **${avgvpg.toFixed(3)}**`
    description+=`\nAvg age: **${avgage}**`
    description+=`\n\n${summaryType == "Trial" ? "-# Gms: Total # of Casual Spawns\n" : ""}-# VPG: Votes per game over past 28 days`

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