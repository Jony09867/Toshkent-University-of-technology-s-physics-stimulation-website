// Bitta model bir necha mavzuga xizmat qilsa, mavzular alohida belgilanadi.
export const completionKey = (config) => config.topicNumber == null
  ? config.id
  : `topic:${config.topicNumber}`;

export function isTopicCompleted(topic, completed) {
  if (!topic.sim) return false;
  return completed.has(`topic:${topic.number}`)
    || (topic.sim.topicNumbers.length === 1 && completed.has(topic.sim.id));
}

export function isConfigCompleted(config, completed) {
  return completed.has(config.id)
    || config.topicNumbers.some((number) => completed.has(`topic:${number}`));
}

export function isCurrentCompleted(config, completed) {
  if (config.topicNumber == null) return completed.has(config.id);
  return completed.has(completionKey(config))
    || (config.topicNumbers.length === 1 && completed.has(config.id));
}

export function toggleCompletion(config, completed) {
  const key = completionKey(config);
  if (config.topicNumber != null && config.topicNumbers.length === 1 && completed.has(config.id)) {
    completed.delete(config.id);
    completed.delete(key);
  } else if (completed.has(key)) {
    completed.delete(key);
  } else {
    completed.add(key);
  }
  return isCurrentCompleted(config, completed);
}
