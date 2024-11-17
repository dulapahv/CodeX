export const generateRoomID = () => {
  const characters = '0ABC1DEF2GHI3JKL4MNO5PQR6STU7VWX8YZ9';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
