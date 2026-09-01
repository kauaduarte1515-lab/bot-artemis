const { Client, GatewayIntentBits, ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, REST, Routes, PermissionFlagsBits, ChannelType } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// SERVIDOR WEB INTEGRADO PARA O SEU UPTIME (MANTÉM O BOT ONLINE)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Artemis Ativa 24h!');
});
server.listen(process.env.PORT || 3000, () => {
    console.log('Servidor de Uptime Web ativo!');
});

const bancoDados = { tiro: {}, bombas: {}, sobrevivencia: {}, warns: {}, ticketsSequencial: 1 };

const commands = [
    { name: 'ajuda', description: 'Comandos do bot.' },
    { name: 'patente', description: 'Ficha militar.' },
    { name: 'ip', description: 'IP do servidor.' },
    { name: 'ranking', description: 'Ranking.' },
    { name: 'atirar', description: 'Jogo de tiro.' },
    { name: 'desarmar', description: 'Jogo da bomba.' },
    { name: 'sobreviver', description: 'Jogo de sobrevivencia.' },
    { name: 'tickets', description: 'Painel de tickets.', default_member_permissions: PermissionFlagsBits.ManageChannels.toString() },
    { name: 'limpar', description: 'Limpa o canal.', default_member_permissions: PermissionFlagsBits.ManageChannels.toString() },
    { name: 'regras', description: 'Painel de regras.', default_member_permissions: PermissionFlagsBits.ManageMessages.toString() },
    { 
        name: 'anuncio', 
        description: 'Envia um anuncio.', 
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
        options: [
            { name: 'titulo', description: 'Titulo', type: 3, required: true },
            { name: 'mensagem', description: 'Mensagem', type: 3, required: true }
        ]
    },
    { 
        name: 'warn', 
        description: 'Aplica advertencia.', 
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
        options: [
            { name: 'membro', description: 'Membro', type: 6, required: true },
            { name: 'motivo', description: 'Motivo', type: 3, required: true }
        ]
    }
];

client.once('ready', async () => {
    console.log('Artemis Conectada!');
    client.user.setActivity('Operacoes Taticas', { type: ActivityType.Watching });
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Comandos Sincronizados com Sucesso!');
    } catch (e) { 
        console.error('Erro na sincronizacao:', e); 
    }
});

// RESPOSTA PERSONALIZADA QUANDO ALGUÉM MARCA O BOT NO CHAT (@Artemis)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user) && !message.content.includes('@everyone') && !message.content.includes('@here')) {
        return message.reply({ content: '🎖️ **Quartel-General Artemis:** Operações Táticas Prontas! Digite `/ajuda` no chat para verificar a nossa lista operacional de comandos slash (/) ou clique nos botões ativos.' });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName, channelId, user, guild, channel, options } = interaction;

        if (commandName === 'ajuda') {
            return interaction.reply({ content: 'Comandos:\nMembros: /ajuda, /patente, /ip, /ranking, /atirar, /desarmar, /sobreviver\nStaff: /regras, /tickets, /limpar, /anuncio, /warn', ephemeral: true });
        }

        if (commandName === 'ip') {
            return interaction.reply({ content: 'IP: `://exercitoartemis.com`', ephemeral: true });
        }

        if (commandName === 'ranking') {
            return interaction.reply({ content: 'Ranking processando.', ephemeral: true });
        }

        if (commandName === 'patente') {
            const cargo = interaction.member.roles.highest.name;
            const warns = bancoDados.warns[user.id]?.quantidade || 0;
            return interaction.reply({ content: `Ficha: ${user.toString()}\nPosto: \`${cargo}\`\nWarns: [ ${warns} / 5 ]`, ephemeral: true });
        }

        if (commandName === 'anuncio') {
            const tit = options.getString('titulo');
            const msg = options.getString('mensagem');
            await interaction.reply({ content: 'Enviado.', ephemeral: true });
            return channel.send({ embeds: [{ title: `📢 ${tit}`, description: msg, color: 0x1A365D }] });
        }

        if (commandName === 'regras') {
            await interaction.reply({ content: 'Regras enviadas.', embeds: [{ title: '🎖️ DIRETRIZES', description: '1. Obedeca ordens.\n2. Proibido Griefing.\n3. Sem toxicidade.\n4. 5 Warns causam isolamento.', color: 0x2E4F23 }] });
        }

        if (commandName === 'tickets') {
            const btn = new ButtonBuilder().setCustomId('abrir_ticket').setLabel('🎫 Abrir Chamado').setStyle(ButtonStyle.Primary);
            await interaction.reply({ content: 'Painel enviado.', ephemeral: true });
            return channel.send({ embeds: [{ title: '🛡️ CENTRAL DE ATENDIMENTO', description: 'Clique abaixo para abrir um chamado.', color: 0x1A365D }], components: [new ActionRowBuilder().addComponents(btn)] });
        }

        if (commandName === 'limpar') {
            await interaction.reply({ content: 'Limpando...', ephemeral: true });
            const novo = await channel.clone({ position: channel.rawPosition });
            await channel.delete();
            return novo.send({ content: 'Canal limpo!' });
        }

        if (commandName === 'warn') {
            const alvo = options.getUser('membro');
            const mot = options.getString('motivo');
            const cLogs = guild.channels.cache.get('1544047087724011752');
            
            if (!bancoDados.warns[alvo.id]) bancoDados.warns[alvo.id] = { quantidade: 0 };
            bancoDados.warns[alvo.id].quantidade += 1;
            const num = bancoDados.warns[alvo.id].quantidade;
            
            const emb = { title: 'Moderação automática', description: `${alvo.toString()} recebeu warn por: ${mot}`, fields: [{ name: 'Infração', value: `${num}ª infração ativa` }], color: 0x990000 };
            
            if (num >= 5) {
                emb.description = `${alvo.toString()} ISOLADO por 5 warns.`;
                const cargo = guild.roles.cache.find(r => r.name === 'Isolamento / Mutado');
                const mb = guild.members.cache.get(alvo.id);
                if (cargo && mb) await mb.roles.add(cargo).catch(() => {});
            }
            await interaction.reply({ content: 'Registrado.', ephemeral: true });
            if (cLogs) cLogs.send({ embeds: [emb] });
        }

        if (commandName === 'atirar') {
            if (channelId !== '1544159419003314267') return interaction.reply({ content: 'Canal incorreto.', ephemeral: true });
            let ciclo = 1;
            const miras = ['[ MIRA: 🎯 ▰ ▰ ▰ ]', '[ MIRA: ▰ 🎯 ▰ ▰ ]', '[ MIRA: ▰ ▰ 🎯 ▰ ]', '[ MIRA: ▰ ▰ ▰ 🎯 ]'];
            const msg = await interaction.reply({ content: miras, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('disp').setLabel('💥 Atirar').setStyle(ButtonStyle.Primary))], fetchReply: true });
            
            const run = setInterval(async () => { 
                if (ciclo >= 4) ciclo = 0; 
                ciclo++; 
                await interaction.editReply({ content: miras[ciclo-1] }).catch(() => clearInterval(run)); 
            }, 1500);
            
            const coll = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
            coll.on('collect', async (i) => { 
                if (i.user.id !== user.id) return; 
                clearInterval(run); 
                coll.stop(); 
                await i.update({ content: ciclo === 3 ? '🎖️ TIRO PERFEITO!' : '❌ ERROU O TEMPO!', components: [] }); 
            });
        }

        if (commandName === 'desarmar') {
            if (channelId !== '1544159465035534386') return interaction.reply({ content: 'Canal incorreto.', ephemeral: true });
            let tempo = 10;
            const fioCerto = Math.random() < 0.5 ? 'v' : 'a';
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('v').setLabel('🔴 Vermelho').setStyle(ButtonStyle.Danger), 
                new ButtonBuilder().setCustomId('a').setLabel('🔵 Azul').setStyle(ButtonStyle.Primary)
            );
            const msg = await interaction.reply({ content: '⏱️ TEMPO: 10s\nEscolha o fio correto para desarmar!', components: [row], fetchReply: true });
            
            const run = setInterval(async () => { 
                tempo -= 2; 
                if (tempo <= 0) { 
                    clearInterval(run); 
                    await interaction.editReply({ content: '💥 FIM DO TEMPO! A BOMBA EXPLODIU!', components: [] }).catch(() => {}); 
                    return; 
                } 
                await interaction.editReply({ content: `⏱️ TEMPO: ${tempo}s` }).catch(() => clearInterval(run)); 
            }, 2000);
            
            const coll = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10000 });
            coll.on('collect', async (i) => { 
                if (i.user.id !== user.id) return;
                clearInterval(run); 
                coll.stop();
                if (i.customId === fioCerto) {
                    await i.update({ content: '🟢 BOMBA DESARMADA COM SUCESSO! Bom trabalho militar.', components: [] });
                } else {
