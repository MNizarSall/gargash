/**
 * Gets an environment variable value and throws an error if it's not defined
 * @param key The environment variable key
 * @returns The environment variable value
 * @throws Error if the environment variable is not defined
 */
export const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not defined`);
  }
  return value;
};
