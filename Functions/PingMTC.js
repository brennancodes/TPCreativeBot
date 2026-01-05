const config = process.env.ENVIRONMENT === "Production" ? require("../config.json") : require("../localConfig.json");
const cron = require("cron");

module.exports = async (client) => {
  let job = new cron.CronJob(config.mtcSettings.pingDateTime, ping)
  job.start();
  process.stdout.write("Reached Ping MTC function\n");
  //setTimeout(() => {ping(true);}, 3000);
  await ping(true);

  async function ping(logOnly = false) {
    const guild = await client.guilds.fetch(config.guildId);

    const role = guild.roles.cache.get(config.roles.mtc);
    if (!role) return console.error("MTC role not found");

    const mtcMemberIds = role.members.map(m => m.user.id);

    const channel = await guild.channels.fetch(config.channels.mtc);
    const pins = await channel.messages.fetchPins();

    const idleMemberIds = new Set();

    if (pins.items.length > 0) {
      for (const pin of pins.items) {
        const message = await pin.message.fetch();
        const reactedIds = new Set();

        // Only look at reactions we care about
        const relevantReactions = message.reactions.cache.filter(r =>
          ["❌", "✅", "⏳"].includes(r.emoji.name)
        );

        // Fetch all reaction users IN PARALLEL
        const userFetches = relevantReactions.map(r => r.users.fetch());
        const usersCollections = await Promise.all(userFetches);

        for (const users of usersCollections) {
          for (const user of users.values()) {
            reactedIds.add(user.id);
          }
        }

        for (const id of mtcMemberIds) {
          if (!reactedIds.has(id) && !message.content.includes(id)) {
            idleMemberIds.add(id);
          }
        }
      }
    }

    if (idleMemberIds.size > 0) {
      let tagUsersString = "";

      for (const memberId of idleMemberIds) {
        tagUsersString += `<@${memberId}>, `;
      }

      tagUsersString +=
        "there are unhandled actions which require your attention. Please review the pinned messages.";
      if (logOnly){
        process.stdout.write("Log: " + tagUsersString + "\n");
      }
      else {
        await channel.send({ content: tagUsersString });
      }
    } else {
        if (logOnly){
            process.stdout.write("Log: All MTC members are up-to-date on their voting, nice work!\n")
        }
        else {
            await channel.send({
              content: "All MTC members are up-to-date on their voting, nice work!",
            });
        }
    }
  }
};