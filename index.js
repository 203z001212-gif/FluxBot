const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Adatok betöltése fájlból
let levels = {};
if (fs.existsSync('./levels.json')) {
    levels = JSON.parse(fs.readFileSync('./levels.json', 'utf8'));
}

// Rangjelzések meghatározása szint szerint
function getRankTitle(level) {
    if (level >= 25) return '🥇 Arany';
    if (level >= 15) return '🥈 Ezüst';
    if (level >= 5) return '🥉 Bronz';
    return 'Kezdő';
}

// Ranglista frissítése a "ranglista" nevű csatornában
async function updateLeaderboard(guild) {
    const channel = guild.channels.cache.find(c => c.name === '🏆ranglista' && c.isTextBased());
    if (!channel) return;

    const sortedUsers = Object.entries(levels)
        .sort((a, b) => {
            if (b[1].level !== a[1].level) {
                return b[1].level - a[1].level;
            }
            return b[1].messages - a[1].messages;
        })
        .slice(0, 10); // Top 10 felhasználó

    let description = '';
    if (sortedUsers.length === 0) {
        description = 'Még nincsenek aktív tagok a ranglistán!';
    } else {
        let rankNum = 1;
        for (const [userId, data] of sortedUsers) {
            const title = getRankTitle(data.level);
            description += `**${rankNum}.** <@${userId}> — Szint: **${data.level}** (${title})\n`;
            rankNum++;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🏆 Szerver Ranglista (Top 10)')
        .setDescription(description)
        .setColor('#FFD700')
        .setTimestamp();

    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        if (messages.size > 0) {
            await channel.bulkDelete(messages, true).catch(() => {});
        }
        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.log('Hiba a ranglista frissítésekor:', err);
    }
}

// 1. KÓD: Új tag köszöntése (amit eddig is használtál)
client.on('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'general' || c.name === 'chat' || c.name === 'üdvözlök');
    if (welcomeChannel) {
        welcomeChannel.send(`Üdvözlünk a szerveren, <@${member.id}>! 🎉 Érezd jól magad!`);
    }
});

// 2. KÓD: Üzenetek számolása és szintlépés
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;

    if (!levels[userId]) {
        levels[userId] = {
            messages: 0,
            level: 0,
            neededForNext: 5
        };
    }

    const userData = levels[userId];
    userData.messages += 1;

    let leveledUp = false;

    if (userData.messages >= userData.neededForNext) {
        userData.level += 1;
        userData.messages = 0;
        userData.neededForNext = 5 + userData.level;
        leveledUp = true;

        const rankTitle = getRankTitle(userData.level);
        let rankMessage = '';
        if (userData.level === 5) rankMessage = ' 🎉 **Elérted a 🥉 Bronz szintet!**';
        if (userData.level === 15) rankMessage = ' 🎉 **Elérted a 🥈 Ezüst szintet!**';
        if (userData.level === 25) rankMessage = ' 🎉 **Elérted a 🥇 Arany szintet!**';

        message.channel.send(
            `Gratulálok <@${userId}>! Szintet léptél! 🚀\n` +
            `**Új szint:** ${userData.level} | **Rangod:** [${rankTitle}]${rankMessage}`
        );
    }

    // Adatok mentése
    fs.writeFileSync('./levels.json', JSON.stringify(levels, null, 2));

    // Ranglista frissítés szintlépéskor
    if (leveledUp && message.guild) {
        await updateLeaderboard(message.guild);
    }

    // Kézi parancs a ranglistához
    if (message.content === '!ranglista' && message.guild) {
        await updateLeaderboard(message.guild);
    }
});

client.login(process.env.DISCORD_TOKEN);