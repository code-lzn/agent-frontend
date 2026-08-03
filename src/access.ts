export default (initialState: { currentUser?: API.LoginUserVO }) => {
  const currentUser = initialState?.currentUser;
  return {
    canSeeAdmin: currentUser?.userRole === 'admin',
    isUser: !!currentUser,
  };
};
