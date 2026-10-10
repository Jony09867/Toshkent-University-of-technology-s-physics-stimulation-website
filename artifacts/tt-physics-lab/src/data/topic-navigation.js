// Katalogdan ochilgan tajriba mavzular ketma-ketligida yuradi.
export function topicNavigation(config, topics, configs) {
  const topicIndex = config.topicNumber == null
    ? -1
    : topics.findIndex((topic) => topic.number === config.topicNumber);

  if (topicIndex >= 0) {
    const neighbor = (offset) => {
      const topic = topics[topicIndex + offset];
      return topic?.sim ? `#/sim/${topic.sim.id}?topic=${topic.number}` : null;
    };
    return {
      label: `MAVZU ${String(config.topicNumber).padStart(2, "0")}`,
      title: config.topicTitle || config.title,
      previous: neighbor(-1),
      next: neighbor(1),
    };
  }

  const index = configs.findIndex((item) => item.id === config.id);
  return {
    label: `TAJRIBA ${String(index + 1).padStart(2, "0")}`,
    title: config.title,
    previous: index > 0 ? `#/sim/${configs[index - 1].id}` : null,
    next: index >= 0 && index < configs.length - 1
      ? `#/sim/${configs[index + 1].id}`
      : null,
  };
}
