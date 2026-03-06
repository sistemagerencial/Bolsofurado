import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const { user, profile, userProfile, loading, signIn, signOut, refreshProfile } = useAuthContext();

  return {
    user,
    profile,
    userProfile,
    session: null,
    loading,
    refreshProfile,
    signIn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
    signUp: async (_params: { name: string; email: string; password: string }) => {},
    signOut,
  };
}
