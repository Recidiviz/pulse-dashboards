export const setup = () => {
  // prevents silly timezone issues when testing dates
  process.env.TZ = "UTC";
};
