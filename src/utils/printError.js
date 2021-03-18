import { logger } from "../index";

export function error(err, message) {
  logger.log(
    "error",
    `${message.author.username} (${message.author.id}) - ${err.message}`
  );

  message.embed({
    title: "Oops!?",
    description: message.author.toString() + " " + err.message,
    color: "#fcc9c5",
  });
}
