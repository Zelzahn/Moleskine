import { logger } from "../index";

export function error(err, message) {
  logger.log(
    "error",
    `${message.author.username} (${message.author.id}) - ${err.message}`
  );

  message.embed({
    title: "Error",
    description: err.message,
    color: "#FF2400",
  });
}
