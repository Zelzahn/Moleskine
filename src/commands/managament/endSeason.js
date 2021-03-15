import { Command } from "discord.js-commando";
import {
    getSetting,
    getCurrentCandidates,
    getWeek,
    getAllUsers,
    getUserBets,
    getMoleBets,
    addScore,
    eliminateCandidate
} from '../../database/mongo';


export default class EndSeasonCommand extends Command {
    constructor(client) {
        super(client, {
            name: "endseason",
            aliases: ["end"],
            group: "management",
            description: "End the season by setting the mole and",
            memberName: "endseason",
            args: [{
                key: "winner",
                prompt: "Please provide the winner",
                type: "string"
            },
            {
                key: "mole",
                prompt: "Please provide who the mole was",
                type: "string"
            }]
        });
    }

    async run(message, { winner, mole }) {
        const owners = await getSetting("owners");
        if (owners.includes(message.author.id)) {
            const current = await getCurrentCandidates();
            if (
                current.length === 3 && winner != mole &&
                current.filter((c) => c.name.toLowerCase() === winner.toLowerCase() ||
                    c.name === mole.toLowerCase()).length === 2
            ) {
                const effectiveW = current.filter((c) => c.name.toLowerCase() === winner.toLowerCase())[0];
                const effectiveM = current.filter((c) => c.name.toLowerCase() === mole.toLowerCase())[0];
                const effectiveL = current.filter((c) => c.name.toLowerCase() !== winner.toLowerCase() && c.name.toLowerCase() !== mole.toLowerCase())[0];
                const week = await getWeek();
                const users = await getAllUsers();
                // Calculate points
                users.forEach(async user => {
                    const bets = await getUserBets(user.userId, user.guildId, week);
                    let count = 0;
                    for (let bet of bets) {
                        if (bet.candidate.equals(effectiveM._id) || bet.candidate.equals(effectiveW._id)) {
                            count += bet.amount;
                        }
                    }
                    let moleBets = await getMoleBets(user.userId, user.guildId);
                    moleBets = moleBets.filter(bet => bet.mole.equals(effectiveM._id));
                    const correctAmount = moleBets.length;
                    let streak = 0;
                    let w = week;
                    for (let bet of moleBets.sort((a, b) => a.week - b.week)) {
                        if (bet.week == w) {
                            streak++;
                            w++;
                        } else {
                            break;
                        }
                    }

                    const added = count + 500 * correctAmount + 100 * streak;
                    await addScore(user.userId, user.guildId, added);
                });
                // Update Candidates
                await eliminateCandidate(effectiveL.name.toLowerCase());
                await eliminateCandidate(winner.toLowerCase());
                await eliminateCandidate(mole.toLowerCase());
                message.react("✅");
            } else {
                throw new Error(`It is not the last week yet or ${winner} or ${mole} is not in the game anymore`);
            }

        }
    }

    onError(err, message) {
        error(err, message);
    }
}