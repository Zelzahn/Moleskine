import { Command } from "discord.js-commando";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { MessageEmbed, MessageAttachment } from "discord.js";
import {
  getSetting,
  getCurrentCandidates,
  eliminateCandidate,
  getAllUsers,
  getWeek,
  getUserBets,
  addScore,
  resetRemainingPoints,
  getAllChannels,
  getAllMoleBets,
} from "../../database/mongo";
import { error } from "../../utils/printError";
import { logger } from "../..";

const width = 800;
const height = 600;

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

const genConfig = (keys, values) => ({
  type: "bar",
  data: {
    labels: keys,
    datasets: [
      {
        data: values,
        backgroundColor: "#7289d9",
      },
    ],
  },
  options: {
    legend: {
      display: false,
    },
    scales: {
      yAxes: [
        {
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

export default class NextWeekCommand extends Command {
  constructor(client) {
    super(client, {
      name: "nextweek",
      aliases: ["next"],
      group: "management",
      hidden: true,
      description: "Eliminate a candidate and go to the next week",
      memberName: "nextweek",
      args: [
        {
          key: "candidate",
          prompt: "Please provide a candidate to eliminate",
          type: "string",
          default: ""
        },
        {
          key: "candidate2",
          prompt: "Please provide a candidate to eliminate",
          default: "",
          type: "string"
        }
      ],
    });
  }

  async run(message, { candidate, candidate2 }) {
    const owners = await getSetting("owners");

    if (owners.includes(message.author.id)) {
      const current = await getCurrentCandidates();
      const filtered = current.filter((c) => c.name.toLowerCase() === candidate.toLowerCase() || c.name.toLowerCase() === candidate2.toLowerCase());
      const one = candidate2 === "";
      const no_one = candidate === "" && one;
      if (
        no_one || (one && filtered.length === 1) || filtered.length === 2
      ) {
        const effectiveC = no_one ? null : filtered[0];
        const effectiveC2 = one ? null : filtered[1];
        // Calculate all points
        const week = await getWeek();
        const users = await getAllUsers();
        users.forEach(async (user) => {
          const bets = await getUserBets(user.userId, user.guildId, week);
          let count = 0;
          for (let bet of bets) {
            if (no_one || !(bet.candidate.equals(effectiveC._id) || (!one && bet.candidate.equals(effectiveC2._id)))) {
              count += bet.amount;
            }
          }
          await addScore(user.userId, user.guildId, count);
          await resetRemainingPoints(user.userId, user.guildId);
        });

        // Get the connected guilds and their moles
        const channels = await getAllChannels();
        const moleBets = await getAllMoleBets();
        const guildMoles = channels.map(({ guildId }) => {
          const filteredMoles = moleBets.filter(
            ({ user }) => user.guildId === guildId
          );
          return filteredMoles.reduce((sums, { mole }) => {
            sums[mole.name] = (sums[mole.name] || 0) + 1;
            return sums;
          }, {});
        });

        // The canvas used to generate the chart
        const canvas = new ChartJSNodeCanvas({
          width,
          height,
          chartCallback,
        });

        // Update Week
        await eliminateCandidate(candidate.toLowerCase(), candidate2.toLowerCase());

        message.react("✅");

        // Notify all servers
        channels.forEach(async (channel) => {
          logger.log("info", `ChannelId: ${channel.channelId}`);
          ch = this.client.channels.fetch(channel.channelId);
          let embed = new MessageEmbed()
            .setTitle("De Mol: Nieuwe Week")
            .setDescription(
              `${candidate + one ? "was" : `en ${candidate2} waren`}  geëlimineerd en een nieuwe week is begonnen. Iedereen kan weer 1000 punten verdelen over de overige deelnemers.`
            );
          ch.embed(embed);

          // Generate the mole chart associated with this guild
          const guildMole = guildMoles.shift();
          const configuration = genConfig(
            Object.keys(guildMole),
            Object.values(guildMole)
          );

          const image = await canvas.renderToBuffer(configuration);
          const attachment = new MessageAttachment(image);
          ch.embed(
            new MessageEmbed({ title: "Dit was vorige week jullie mol:" })
          );
          ch.say(attachment);
        });
      } else {
        throw new Error(
          `${candidate + one ? "" : `or ${candidate2}`} is not a candidate or not in the game anymore`
        );
      }
    }
  }

  onError(err, message) {
    error(err, message);
  }
}
