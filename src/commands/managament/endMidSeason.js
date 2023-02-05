import { Command } from "discord.js-commando";
import { MessageEmbed, MessageAttachment } from "discord.js";
import {
    getSetting,
    getCurrentCandidates,
    getWeek,
    getAllUsers,
    getAllChannels,
    getAllMoleBets,
    getUserBets,
    getMoleBets,
    addScore,
    eliminateCandidate,
    getAllScores,
    getCandidates
} from "../../database/mongo";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import colorLib from "@kurkle/color";

const width = 800;
const height = 600;

const COLORS = [
    "#4dc9f6",
    "#f67019",
    "#f53794",
    "#537bc4",
    "#acc236",
    "#166a8f",
    "#00a950",
    "#58595b",
    "#8549ba",
];

function transparentize(value, opacity) {
    const alpha = opacity === undefined ? 0.5 : 1 - opacity;
    return colorLib(value).alpha(alpha).rgbString();
}

const chartCallback = (ChartJS) => {
    ChartJS.plugins.register({
        beforeDraw: (chartInstance) => {
            const { chart } = chartInstance;
            const { ctx } = chart;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, chart.width, chart.height);
        },
    });
};

const weeks = [...Array(8).keys()];
weeks.shift(); // Array starts at 0

const genConfig = (data) => ({
    type: "bar",
    data: {
        labels: weeks,
        datasets: data,
    },
    options: {
        scales: {
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: "Week",
                    },
                },
            ],
            yAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: "Aantal stemmen",
                    },
                    ticks: {
                        beginAtZero: true,
                        callback: (value) => {
                            if (value % 1 === 0) return value;
                        },
                    },
                },
            ],
        },
    },
});

export default class EndMidSeasonCommand extends Command {
    constructor(client) {
        super(client, {
            name: "endmidseason",
            aliases: ["endmid"],
            group: "management",
            description: "End the season midway by setting the mole and",
            memberName: "endmidseason",
            hidden: true,
            args: [
                {
                    key: "winner",
                    prompt: "Please provide the winner",
                    type: "string",
                },
                {
                    key: "mole",
                    prompt: "Please provide who the mole was",
                    type: "string",
                },
                {
                    key: "firstmole",
                    prompt: "The first mole",
                    default: "",
                    type: "string"
                }
            ],
        });
    }

    async run(message, { winner, mole, fMole }) {
        const owners = await getSetting("owners");
        if (owners.includes(message.author.id)) {
            const current = await getCurrentCandidates();
            if (
                current.length === 3 &&
                winner != mole &&
                current.filter(
                    (c) =>
                        c.name.toLowerCase() === winner.toLowerCase() ||
                        c.name.toLowerCase() === mole.toLowerCase()
                ).length === 2
            ) {
                const effectiveW = current.filter(
                    (c) => c.name.toLowerCase() === winner.toLowerCase()
                )[0];
                const effectiveM = current.filter(
                    (c) => c.name.toLowerCase() === mole.toLowerCase()
                )[0];
                const effectiveL = current.filter(
                    (c) =>
                        c.name.toLowerCase() !== winner.toLowerCase() &&
                        c.name.toLowerCase() !== mole.toLowerCase()
                )[0];
                const all = await getCandidates();
                let effectiveFM = all.filter((c) => c.name.toLowerCase() === fMole.toLowerCase());
                effectiveFM = effectiveFM.length === 0 ? undefined : effectiveFM[0];
                let mweek = effectiveFM === undefined ? 0 : effectiveFM.week;
                const week = await getWeek();
                const users = await getAllUsers();

                // Calculate points
                users.forEach(async (user) => {
                    const bets = await getUserBets(user.userId, user.guildId, week);
                    let count = 0;
                    for (let bet of bets) {
                        if (bet.candidate.equals(effectiveW._id)) {
                            count += bet.amount;
                        }
                    }
                    let moleBets = await getMoleBets(user.userId, user.guildId);
                    moleBets = moleBets.filter((bet) => (bet.week > mweek && bet.mole.equals(effectiveM._id)) || bet.mole.equals(effectiveFM._id));
                    const correctAmount = moleBets.length;
                    let isstreak = true;
                    let w = week;
                    let streak = 0;
                    for (let bet of moleBets.sort((a, b) => a.week - b.week)) {
                        if (isstreak) {
                            if (bet.week == w) {
                                streak++;
                                w--;
                            } else {
                                isstreak = false;
                            }
                        } else if (mweek === bet.week) {
                            isstreak = true;
                            w = mweek - 1;
                            streak++;
                        }

                    }
                    const added = count + 500 * correctAmount + 100 * streak;
                    await addScore(user.userId, user.guildId, added);
                });

                // Update Candidates
                await eliminateCandidate(effectiveL.name.toLowerCase());
                await eliminateCandidate(winner.toLowerCase());
                await eliminateCandidate(mole.toLowerCase());
                await message.react("✅");

                // Get the connected guilds and their moles
                const channels = await getAllChannels();
                const moleBets = await getAllMoleBets();
                const guildMoles = Object.assign({}, ...channels.map(({ guildId }) => {
                    // get moles associated with this guild
                    const filteredMoles = moleBets.filter(
                        ({ user }) => user.guildId === guildId
                    );

                    // count occurences for each week
                    const weekMoles = weeks.map((i) => {
                        return filteredMoles
                            .filter(({ week }) => week == i)
                            .reduce((sums, { mole }) => {
                                sums[mole.name] = (sums[mole.name] || 0) + 1;
                                return sums;
                            }, {});
                    });

                    // get the mole bets for each week
                    return ({
                        [guildId]: weekMoles.map((week) => {

                            return Object.entries(week)
                                .reduce((a, e, i) => ((a[e[0]] = e[1]), a), {});
                        })
                    });
                }));

                // The canvas used to generate the chart
                const canvas = new ChartJSNodeCanvas({
                    width,
                    height,
                    chartCallback,
                });
                channels.forEach(async (channel) => {
                    let ch = await this.client.channels.fetch(channel.channelId);
                    const guildMole = guildMoles[channel.guildId];
                    let data = {};

                    for (const week in guildMole) {
                        const moles = guildMole[week];
                        const molesArr = Object.entries(moles);

                        for (const mole of molesArr) {
                            if (mole[0] in data) data[mole[0]][week] = mole[1];
                            else {
                                data[mole[0]] = Array(7).fill(0.05);
                                data[mole[0]][week] = mole[1];
                            }
                        }
                    }
                    data = Object.entries(data).map((candidate, index) => ({
                        label: candidate[0],
                        data: candidate[1],
                        borderColor: COLORS[index],
                        backgroundColor: transparentize(COLORS[index], 0.5),
                        fill: false,
                        tension: 0,
                    }));

                    const configuration = genConfig(data);
                    const image = await canvas.renderToBuffer(configuration);
                    const attachment = new MessageAttachment(image, "chart.png");
                    const leaderboard = await getAllScores(channel.guildId);
                    const expandedUser = await this.client.users.fetch(leaderboard[0].userId);
                    let embed = new MessageEmbed()
                        .setTitle("De Mol: Einde Seizoen")
                        .setDescription(
                            `||${winner}|| won dit seizoen van *De Mol* en ontmaskerde zo ||${mole}|| als mol.
              ${expandedUser} won de competitie en behaalde zo'n ${leaderboard[0].score} punten.
              `
                        );

                    const lb = new MessageEmbed().setTitle("Leaderboard");

                    let description = "";

                    for (const [index, user] of leaderboard.entries()) {
                        const expandedUser = await this.client.users.fetch(user.userId);
                        description += `\n\`${index + 1}.${index + 1 < 10 ? " " : ""
                            }\` ${expandedUser}:\t**${user.score} ${user.score == 1 ? "punt" : "punten"
                            }**`;
                    }

                    lb.setDescription(description);
                    await ch.send(embed);
                    await ch.send(lb);
                    await ch.send(
                        new MessageEmbed()
                            .setTitle("Dit was jullie mol over de weken heen:")
                            .attachFiles(attachment)
                            .setImage("attachment://chart.png")
                    );
                });
            } else {
                throw new Error(
                    `It is not the last week yet or ${winner} or ${mole} is not in the game anymore`
                );
            }
        }
    }

    onError(err, message) {
        console.log(err);
        error(err, message);
    }
}
